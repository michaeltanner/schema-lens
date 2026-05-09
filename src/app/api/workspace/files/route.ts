import { NextRequest, NextResponse } from 'next/server';
import { schemaParser } from '@/core/parser/schemaParser';
import { workspaceManager } from '@/core/workspace/workspaceManager';
import { XMLValidator } from 'fast-xml-parser';

import JSZip from 'jszip';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const bootstrap = searchParams.get('bootstrap');
    const filename = searchParams.get('name');
    const downloadAll = searchParams.get('all') === 'true';
    
    // 1. Download all files as ZIP
    if (downloadAll) {
      try {
        console.log('API: Generating ZIP for all files');
        const files = workspaceManager.getFiles();
        if (files.length === 0) {
          return NextResponse.json({ error: 'No files to download' }, { status: 404 });
        }

        const zip = new JSZip();
        for (const file of files) {
          const content = workspaceManager.getFileContent(file.name);
          if (content) {
            zip.file(file.name, content);
          }
        }

        const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
        
        return new NextResponse(zipBuffer as any, {
          headers: {
            'Content-Type': 'application/zip',
            'Content-Disposition': 'attachment; filename="schemalens-workspace.zip"',
            'Content-Length': zipBuffer.length.toString(),
          },
        });
      } catch (err) {
        console.error('ZIP generation error:', err);
        return NextResponse.json({ error: 'Failed to generate ZIP' }, { status: 500 });
      }
    }

    // 2. Download or View a single file
    if (filename) {
      try {
        const isDownload = searchParams.get('download') === 'true';
        const safeName = workspaceManager.sanitizeName(filename);
        const content = workspaceManager.getFileContent(safeName);
        if (!content) {
          console.error(`API: File not found: ${filename} (sanitized as ${safeName})`);
          return NextResponse.json({ error: 'File not found' }, { status: 404 });
        }

        const headers: Record<string, string> = {
          'Content-Type': 'application/xml',
          'Content-Length': content.length.toString(),
        };

        if (isDownload) {
          // Use the sanitized name for the header to prevent injection
          headers['Content-Disposition'] = `attachment; filename="${safeName}"`;
        }

        return new NextResponse(content as any, {
          headers
        });
      } catch (err) {
        console.error(`File access error for ${filename}:`, err);
        return NextResponse.json({ error: 'Failed to access file' }, { status: 500 });
      }
    }

    // 3. List files (existing behavior)
    // Perform bootstrapping if requested or if this is the first run
    if (bootstrap === 'true') {
      workspaceManager.bootstrap(true);
    } else {
      workspaceManager.bootstrap(false);
    }

    const files = workspaceManager.getFiles();
    return NextResponse.json(files);
  } catch (error) {
    console.error('List files error:', error);
    return NextResponse.json({ error: 'Failed to list files' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (!file.name.endsWith('.xsd')) {
      return NextResponse.json({ error: 'Only .xsd files are allowed' }, { status: 400 });
    }

    const content = await file.text();
    
    // Validate XML structure
    const validationResult = XMLValidator.validate(content);
    if (validationResult !== true) {
      return NextResponse.json({ 
        error: 'Invalid XSD format', 
        details: validationResult.err.msg,
        line: validationResult.err.line
      }, { status: 400 });
    }

    const buffer = Buffer.from(content);
    workspaceManager.addFile(file.name, buffer);
    
    // Reset parser to force re-indexing on next request
    schemaParser.reset();

    return NextResponse.json({ success: true, name: file.name });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { name, enabled } = await req.json();

    if (!name || typeof enabled !== 'boolean') {
      return NextResponse.json({ error: 'Name and enabled status are required' }, { status: 400 });
    }

    workspaceManager.toggleFile(name, enabled);
    
    // Reset parser to force re-indexing
    schemaParser.reset();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Toggle error:', error);
    return NextResponse.json({ error: 'Failed to toggle file' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filename = searchParams.get('name');
    const all = searchParams.get('all') === 'true';

    if (all) {
      workspaceManager.deleteAllFiles();
      schemaParser.reset();
      return NextResponse.json({ success: true });
    }

    if (!filename) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
    }

    workspaceManager.deleteFile(filename);
    
    // Reset parser to force re-indexing
    schemaParser.reset();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 });
  }
}
