import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { schemaParser } from '@/core/parser/schemaParser';
import { workspaceManager } from '@/core/workspace/workspaceManager';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    const type = searchParams.get('type') as 'element' | 'complexType' | 'simpleType';
    const optional = searchParams.get('optional') === 'true';

    if (!name || !type) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const schemaDir = workspaceManager.getSchemaDir();
    const example = await schemaParser.getExample(schemaDir, name, type, optional);

    return NextResponse.json({ example });
  } catch (error) {
    console.error('Example generation error:', error);
    return NextResponse.json({ error: 'Failed to generate example' }, { status: 500 });
  }
}
