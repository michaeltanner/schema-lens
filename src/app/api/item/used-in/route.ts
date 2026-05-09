import { NextRequest, NextResponse } from 'next/server';
import { schemaParser } from '@/core/parser/schemaParser';
import { workspaceManager } from '@/core/workspace/workspaceManager';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name');

  if (!name) {
    return NextResponse.json({ error: 'Missing name parameter' }, { status: 400 });
  }

  try {
    const schemaDir = workspaceManager.getSchemaDir();
    const usedIn = await schemaParser.getUsedIn(schemaDir, name);
    return NextResponse.json(usedIn);
  } catch (error) {
    console.error('Used-in lookup error:', error);
    return NextResponse.json({ error: 'Failed to compute cross-references' }, { status: 500 });
  }
}
