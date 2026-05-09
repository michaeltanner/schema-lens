import Prism from 'prismjs';

// Import Prism components and theme
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-xml-doc';
import 'prismjs/themes/prism-tomorrow.css';

// Import line numbers plugin
import 'prismjs/plugins/line-numbers/prism-line-numbers';
import 'prismjs/plugins/line-numbers/prism-line-numbers.css';

export const setupPrism = () => {
  if (typeof window === 'undefined') return;

  // Add a hook to track XML depth and add classes
  if (!((Prism.hooks as any).all['after-tokenize']?.some((h: any) => h.name === 'xmlDepthHook'))) {
    const xmlDepthHook = (env: any) => {
      if (env.language !== 'markup' && env.language !== 'xml') return;
      
      let depth = 0;
      const tokens = env.tokens;
      
      const process = (tokenList: any[]) => {
        tokenList.forEach(token => {
          if (typeof token === 'string') return;

          if (token.type === 'tag') {
            const getText = (c: any): string => {
              if (typeof c === 'string') return c;
              if (Array.isArray(c)) return c.map(getText).join('');
              return getText(c.content);
            };

            const text = getText(token.content);
            const isClosing = text.includes('</') || text.startsWith('</');
            const isSelfClosing = text.includes('/>') || text.endsWith('/>');

            if (isClosing) {
              depth = Math.max(0, depth - 1);
            }

            const depthClass = `depth-${depth % 6}`;
            if (!token.alias) {
              token.alias = depthClass;
            } else if (Array.isArray(token.alias)) {
              token.alias.push(depthClass);
            } else {
              token.alias = [token.alias, depthClass];
            }

            if (!isClosing && !isSelfClosing) {
              depth++;
            }
          } else if (token.content && Array.isArray(token.content)) {
            process(token.content);
          }
        });
      };

      process(tokens);
    };
    
    Object.defineProperty(xmlDepthHook, 'name', { value: 'xmlDepthHook' });
    Prism.hooks.add('after-tokenize', xmlDepthHook);
  }
};

export default Prism;
