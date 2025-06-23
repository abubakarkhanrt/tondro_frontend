/**
 * ──────────────────────────────────────────────────
 * File: client/eslint-rules/require-testid.js
 * Description: Custom ESLint rule to enforce data-testid attributes on interactive elements
 * Author: Muhammad Abubakar Khan
 * Created: 18-06-2025
 * Last Updated: 20-06-2025
 * ──────────────────────────────────────────────────
 */

const interactiveElements = [
  'Button', 'TextField', 'Select', 'Checkbox', 'Radio',
  'Switch', 'IconButton', 'Fab', 'Link', 'MenuItem',
  'Dialog', 'Modal', 'Drawer', 'Accordion', 'Tabs'
];

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce data-testid attributes on interactive elements',
      category: 'Testing',
      recommended: true,
    },
    fixable: null,
    schema: [],
    messages: {
      missingTestId: 'Interactive element must have a data-testid attribute for testing purposes.',
    },
  },
  create(context) {
    return {
      JSXElement(node) {
        const openingElement = node.openingElement;
        const elementName = openingElement.name?.name;
        const attributes = openingElement.attributes;

        if (interactiveElements.includes(elementName)) {
          const hasTestId = attributes.some(attr =>
            attr.type === 'JSXAttribute' &&
            attr.name &&
            attr.name.type === 'JSXIdentifier' &&
            attr.name.name === 'data-testid'
          );
          if (!hasTestId) {
            context.report({
              node: openingElement,
              messageId: 'missingTestId',
            });
          }
        }
      },
    };
  },
}; 