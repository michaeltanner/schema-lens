import { NextResponse } from 'next/server';
import { schemaParser } from '@/core/parser/schemaParser';
import { workspaceManager } from '@/core/workspace/workspaceManager';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const shouldReset = searchParams.get('reset') === 'true';
  const requestId = Math.random().toString(36).substring(7);
  
  if (shouldReset) {
    console.log(`[${requestId}] API /api/workspace: Force resetting parser...`);
    schemaParser.reset();
  }

  console.log(`[${requestId}] API /api/workspace: Starting...`);
  try {
    const schemaDir = workspaceManager.getSchemaDir();
    console.log(`[${requestId}] API /api/workspace: Using schema dir: ${schemaDir}`);
    
    const summary = await schemaParser.parseAll(schemaDir, shouldReset);
    console.log(`[${requestId}] API /api/workspace: Parsing complete. Found ${summary.totalElements} elements.`);

    return NextResponse.json(summary);
  } catch (error: any) {
    console.error(`[${requestId}] API /api/workspace: Error:`, error);
    return NextResponse.json({ error: error.message || 'Failed to load schemas' }, { status: 500 });
  }
}
