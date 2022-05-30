import { API, FileInfo, Options, Transform } from 'jscodeshift';

const COMPONENTS = ['Avatar', 'Button'];
const WINERY_LIB_PATH = '@xingternal/winery-ui';
const REBRANDING_LIB_PATH = '@xingternal/rebranding-adapter/winery';

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
      (value.source.value as string).includes(WINERY_LIB_PATH)
    );

  // If no winery import then skip file
  if (wineryRootImport.length === 0) {
    console.warn(`No winery imports found in: ${file.path}`);
    return;
  }

  // Check if the imported components from winery are the ones that needs a rebranding
  const rebrandedWineryImports = wineryRootImport.forEach(
    (wineryComponents) => {
      j(wineryComponents)
        .find(j.ImportSpecifier)
        .forEach((component) => {
          // Skip value if imported component is not the one that needs a rebrand
          // e.g: import { Logo,Button } from '@xingternal/winery-ui'; -> ["Logo", "Button"]
          if (!COMPONENTS.includes(component.node.imported.name)) {
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
            .filter(({ value }) => value.source.value === REBRANDING_LIB_PATH);

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
                j.stringLiteral(REBRANDING_LIB_PATH),
                'value'
              )
            );
          }

          // Remove from winery imports the current component alias name
          j(component).remove();
        });
    }
  );

  // return applied changes
  return rebrandedWineryImports.toSource({
    quote: 'single',
    reuseWhitespace: false,
    ...options,
  });
};

export default wineryRebrandingTransform;
