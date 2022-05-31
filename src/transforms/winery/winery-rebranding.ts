import {
  API,
  Collection,
  FileInfo,
  JSCodeshift,
  Options,
  Transform,
} from 'jscodeshift';

const WINERY = {
  COMPONENTS: ['Avatar', 'Button'],
  JSX_PROVIDER: 'ThemeProvider',
  LIB_PATH: '@xingternal/winery-ui',
};
const REBRANDING = {
  JSX_PROVIDER: 'RebrandingProvider',
  LIB_PATH: '@xingternal/rebranding-adapter/winery',
  ENABLED_PROP: 'enabled',
  ENABLED_VALUE: false,
};

function addRebrandingProviderWrapper(source: Collection, j: JSCodeshift) {
  source.findJSXElements(WINERY.JSX_PROVIDER).forEach((element) => {
    // Wrapp Winery-UI them provider with the new rebranding provider and use the original component as children
    const wrappedWineryProvider = j.jsxElement(
      j.jsxOpeningElement(j.jsxIdentifier(REBRANDING.JSX_PROVIDER), [
        // Create a prop on the rebranding provider so it works as expected
        // e.g: <RebrandingProvider enabled={false}>
        j.jsxAttribute(
          j.jsxIdentifier(REBRANDING.ENABLED_PROP),
          j.jsxExpressionContainer(j.booleanLiteral(REBRANDING.ENABLED_VALUE))
        ),
      ]),
      j.jsxClosingElement(j.jsxIdentifier(REBRANDING.JSX_PROVIDER)),
      [element.value] // Pass in the original component as children
    );

    wrappedWineryProvider.comments = element.value.comments || [];
    wrappedWineryProvider.comments.push(
      j.commentBlock(`
* TODO (Rebranding-Codemod generated): Please provide a feature flag.
* Feature Flag Name = REBRANDING_ONLYFY_BERRY :)
`)
    );

    j(element).replaceWith(wrappedWineryProvider);
  });
}

const wineryRebrandingTransform: Transform = (
  file: FileInfo,
  api: API,
  options: Options
) => {
  // Alias the jscodeshift API for ease of use
  const j = api.jscodeshift;
  // Convert the entire file source into a collection of nodes paths
  const root = j(file.source);

  // Find winery import node
  const wineryRootImport = root
    .find(j.ImportDeclaration)
    .filter(({ value }) =>
      (value.source.value as string).includes(WINERY.LIB_PATH)
    );

  // If no winery import then skip file
  if (wineryRootImport.length === 0) {
    console.warn(`No winery imports found in: ${file.path}`);
    return;
  }

  // Check if the imported components from winery are the ones that needs a rebranding
  wineryRootImport.forEach((wineryComponents) => {
    j(wineryComponents)
      .find(j.ImportSpecifier)
      .forEach((component) => {
        // Skip value if imported component is not the one that needs a rebrand
        // e.g: import { Logo,Button } from '@xingternal/winery-ui'; -> ["Logo", "Button"]
        if (!WINERY.COMPONENTS.includes(component.node.imported.name)) {
          console.warn(
            `No winery components to be rebranded found in: ${file.path}`
          );
          return;
        }

        const importAdapterSpecifier = j.importSpecifier(
          // winery component name
          j.identifier(component.node.imported.name),
          // component alias name
          // e.g: import { Button as SuperButton } from '@xingternal/winery-ui';
          j.identifier(component.node.local.name)
        );
        // Find rebranding import path
        // e.g: import { X } from '@xingternal/rebranding-adapter/winery';
        const adapterImports = root
          .find(j.ImportDeclaration)
          .filter(({ value }) => value.source.value === REBRANDING.LIB_PATH);

        // If adapter imports are already in the file then add a new one
        if (adapterImports.length) {
          adapterImports.forEach((adapterImport) => {
            // Add new component import to the new rebranding lib module
            // e.g: import { -FIZZ, BUZZ, -FIZZBUZZ } from '@xingternal/winery-ui';
            //      import { FIZZ, +FIZZBUZZ } from '@xingternal/rebranding-adapter/winery';
            j(adapterImport).replaceWith(
              j.importDeclaration(
                // Insert our new rebranding component import specificer
                [...adapterImport.node.specifiers, importAdapterSpecifier],
                adapterImport.node.source
              )
            );
          });
        } else {
          // Add after '@xingternal/winery-ui' import the new rebranding lib module
          // e.g: import { -FIZZ, BUZZ } from '@xingternal/winery-ui';
          //      +import { FIZZ } from '@xingternal/rebranding-adapter/winery';
          wineryRootImport.insertAfter(
            j.importDeclaration(
              [importAdapterSpecifier],
              j.stringLiteral(REBRANDING.LIB_PATH),
              'value'
            )
          );
        }

        // Remove from winery imports the current component alias name
        j(component).remove();
      });
  });

  // Add RebrandingProvider import
  // e.g: import { Avatar, Button, +RebrandingProvider } from '@xingternal/rebranding-adapter/winery';
  const rebrandingProviderSpecifier = j.importSpecifier(
    j.identifier(REBRANDING.JSX_PROVIDER)
  );

  root
    .find(j.ImportDeclaration)
    .filter(({ value }) => value.source.value === REBRANDING.LIB_PATH)
    .forEach((adapterImport) => {
      j(adapterImport).replaceWith(
        j.importDeclaration(
          // Insert our new rebranding component import specificer
          [...adapterImport.node.specifiers, rebrandingProviderSpecifier],
          adapterImport.node.source
        )
      );
    });

  addRebrandingProviderWrapper(root, j);

  // return AST with applied changes
  return root.toSource({
    quote: 'single',
    reuseWhitespace: false,
    ...options,
  });
};

export default wineryRebrandingTransform;
