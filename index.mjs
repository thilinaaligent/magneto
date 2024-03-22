#!/usr/bin/env node

import * as p from "@clack/prompts";
import color from "picocolors";
import {
    getMagentoModuleName,
    getMagentoThemes,
    copyFileToOverride,
} from "./utils.mjs";

async function main() {
    const overridingAFile = await p.group(
        {
            originalFilePath: () =>
                p.text({
                    message: "What is the absolute path to the template file?",
                    validate: (value) => {
                        if (!value) return "Please enter a path.";
                        // if (value[0] !== '.') return 'Please enter a relative path.';
                    },
                }),
        },
        {
            onCancel: () => {
                p.cancel("Operation cancelled.");
                process.exit(0);
            },
        }
    );

    if (overridingAFile.originalFilePath) {
        const { modulePath, filePath } = overridingAFile.originalFilePath.match(
            /(?<modulePath>.*\/vendor\/magento\/.*?\/)view\/frontend\/templates\/(?<filePath>.*$)/
        )?.groups;
        const magentoPath = overridingAFile.originalFilePath.match(
            /(?<designPath>.*\/)vendor\/magento\//
        )?.groups?.designPath;

        if (!modulePath) {
            console.log("cant find module");
            process.exit(0);
        }

        const moduleXMLPath = `${modulePath}/etc/module.xml`;
        const designPath = magentoPath
            ? `${magentoPath}app/design/frontend/`
            : undefined;

        const moduleName = await getMagentoModuleName(moduleXMLPath);
        const themes = await getMagentoThemes(designPath);

        const selectedTheme =
            themes.length === 1
                ? themes[0].path
                : await p.select({
                      message: `Pick a theme`,
                      options: themes.map(({ theme, path }) => ({
                          value: path,
                          label: theme,
                      })),
                  });

        if (!filePath) process.exit(0);

        const s = p.spinner();
        s.start(`Attempting to override ${filePath} from ${moduleName}`);

        // p.note(
        //     `${color.green(`Attempting to override`)} ${filePath} ${color.green(`from`)} ${moduleName}`
        // );

        const { success, message } = await copyFileToOverride(
            overridingAFile.originalFilePath,
            `${selectedTheme}/${moduleName}/templates/${filePath}`
        );

        s.stop(message);

        if (!success) {
            process.exit(0);
        }

        p.outro(
            "Don't forget to commit the original file before doing changes!"
        );

        // if (success) {
        //     p.outro(message);
        // } else {
        //     p.outro(message);
        // }
    }
}

main().catch(console.error);
