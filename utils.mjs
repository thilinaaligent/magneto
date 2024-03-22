import { readFile, readdir, copyFile, constants, mkdir } from "fs/promises";
import { parseStringPromise } from "xml2js";
import color from "picocolors";

export const showMessage = (message, isError = false) => {
    if (isError) {
        console.log(`${color.bgRed(color.white(message))}`);
    } else {
        console.log(`${color.green(message)}`);
    }
};

export const getMagentoModuleName = async (path) => {
    const xmlModuleFileContent = await readFile(path);
    const xmlData = await parseStringPromise(xmlModuleFileContent);

    return xmlData?.config?.module?.[0]?.$?.name;
};

export const getMagentoThemes = async (path) => {
    const themePaths = await Promise.all(
        (await readdir(path, { withFileTypes: true }))
            .filter(
                (dirent) => dirent.isDirectory() && dirent.name !== "Magento"
            )
            .map(async (dirent) => {
                const currentVendor = dirent.name;
                const currentVendorPath = `${path}${currentVendor}/`;
                const themeFolders = (
                    await readdir(currentVendorPath, { withFileTypes: true })
                )
                    .filter((dirent) => dirent.isDirectory())
                    .map((dirent) => dirent.name);
                return themeFolders.map((theme) => ({
                    theme: `${currentVendor}/${theme}`,
                    path: `${currentVendorPath}${theme}`,
                }));
            })
    );
    return themePaths.flat();
};

export const copyFileToOverride = async (originalFile, themeOverrideFile) => {
    const themeOverrideFolderPath =
        themeOverrideFile.match(/^(.+)\/([^\/]+)$/)?.[1];

    if (!themeOverrideFile) throw Error("folder not found");

    return await mkdir(themeOverrideFolderPath, { recursive: true }).then(
        async () =>
            await copyFile(
                originalFile,
                themeOverrideFile,
                constants.COPYFILE_EXCL
            )
                .then(function () {
                    return {
                        success: true,
                        message: `${color.green("File overriden at")} ${themeOverrideFile.split("app/design/frontend/")[1]}`,
                    };
                })
                .catch(function (error) {
                    return {
                        success: false,
                        message: color.bgRed(
                            color.white(` ${error.message.split(",")[0]}. `)
                        ),
                    };
                })
    );
};
