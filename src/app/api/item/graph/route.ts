import { NextResponse } from 'next/server';
import { schemaParser } from '@/core/parser/schemaParser';
import { workspaceManager } from '@/core/workspace/workspaceManager';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const nodeParam = searchParams.get('node'); // e.g. "element:SomeMessage"
    const schemaDir = workspaceManager.getSchemaDir();
    
    const topology = await schemaParser.getTopology(schemaDir, nodeParam);

    return NextResponse.json(topology);
  } catch (error) {
    console.error('Topology loading error:', error);
    return NextResponse.json({ error: 'Failed to load topology' }, { status: 500 });
  }
}
