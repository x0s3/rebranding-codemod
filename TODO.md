- [ ] Corner case when removing all components from winery
  - `import "@xingternal/winery-ui";`
- [ ] Support individual imports
  - `import Button from "@xingternal/winery-ui/lib/Button";`
  - Can be fixed running autogroup babel plugin that is already created :)
- [x] ~Support component import aliases~
- [x] ~Wrap winery theme provider with the new adapter one~
- [ ] Create a shell script to run the following commands:
  - `yarn add -E @xingternal/rebranding-adapter`
  - `npx @xingternal/rebranding-mods --lib=winery|brewery [--options]`
  - `prettier --write $(git diff --name-only)`
