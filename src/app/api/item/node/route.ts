import { NextRequest, NextResponse } from 'next/server';
import { schemaParser } from '@/core/parser/schemaParser';
import { workspaceManager } from '@/core/workspace/workspaceManager';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name');
  const type = searchParams.get('type') as 'element' | 'complexType' | 'simpleType' | null;

  if (!name || !type) {
    return NextResponse.json({ error: 'Missing name or type parameter' }, { status: 400 });
  }

  try {
    const schemaDir = workspaceManager.getSchemaDir();
    const itemNode = await schemaParser.getItem(schemaDir, name, type);

    if (!itemNode) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json(itemNode);
  } catch (error) {
    console.error('Item loading error:', error);
    return NextResponse.json({ error: 'Failed to load item' }, { status: 500 });
  }
}
