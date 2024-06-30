import { $ } from "bun";
import fs from "fs/promises";
const REPO = `TakWolf/fusion-pixel-font`;
const NAME_PLACEHOLDER = "XFONT NAME PLACEHOLDERX";
const ID_PLACEHOLDER = "xfont-name-placeholderx";
const VERSION_PLACEHOLDER = "v114.514";
const LICENSE_URL = "https://raw.githubusercontent.com/TakWolf/fusion-pixel-font/master/LICENSE-OFL"
const AUTHOR = "TakWolf (https://takwolf.com)"
const SOURCE_URL = `https://github.com/TakWolf/fusion-pixel-font`
const PLACEHOLDER_PACKAGE = "./" + ID_PLACEHOLDER;
const LOCALES_MAP = {
  latin: "latin",
  ja: "japanese",
  ko: "korean",
  zh_hans: "chinese-simplified",
  zh_hant: "chinese-traditional",
}
/*
fusion-pixel-font-10px-monospaced-bdf-v2024.05.12.zip
fusion-pixel-font-10px-monospaced-otc-v2024.05.12.zip
fusion-pixel-font-10px-monospaced-otf-v2024.05.12.zip
fusion-pixel-font-10px-monospaced-pcf-v2024.05.12.zip
fusion-pixel-font-10px-monospaced-ttc-v2024.05.12.zip
fusion-pixel-font-10px-monospaced-ttf-v2024.05.12.zip
fusion-pixel-font-10px-monospaced-woff2-v2024.05.12.zip
fusion-pixel-font-10px-proportional-bdf-v2024.05.12.zip
fusion-pixel-font-10px-proportional-otc-v2024.05.12.zip
fusion-pixel-font-10px-proportional-otf-v2024.05.12.zip
fusion-pixel-font-10px-proportional-pcf-v2024.05.12.zip
fusion-pixel-font-10px-proportional-ttc-v2024.05.12.zip
fusion-pixel-font-10px-proportional-ttf-v2024.05.12.zip
fusion-pixel-font-10px-proportional-woff2-v2024.05.12.zip
fusion-pixel-font-12px-monospaced-bdf-v2024.05.12.zip
fusion-pixel-font-12px-monospaced-otc-v2024.05.12.zip
fusion-pixel-font-12px-monospaced-otf-v2024.05.12.zip
fusion-pixel-font-12px-monospaced-pcf-v2024.05.12.zip
fusion-pixel-font-12px-monospaced-ttc-v2024.05.12.zip
fusion-pixel-font-12px-monospaced-ttf-v2024.05.12.zip
fusion-pixel-font-12px-monospaced-woff2-v2024.05.12.zip
fusion-pixel-font-12px-proportional-bdf-v2024.05.12.zip
fusion-pixel-font-12px-proportional-otc-v2024.05.12.zip
fusion-pixel-font-12px-proportional-otf-v2024.05.12.zip
fusion-pixel-font-12px-proportional-pcf-v2024.05.12.zip
fusion-pixel-font-12px-proportional-ttc-v2024.05.12.zip
fusion-pixel-font-12px-proportional-ttf-v2024.05.12.zip
fusion-pixel-font-12px-proportional-woff2-v2024.05.12.zip
fusion-pixel-font-8px-monospaced-bdf-v2024.05.12.zip
fusion-pixel-font-8px-monospaced-otc-v2024.05.12.zip
fusion-pixel-font-8px-monospaced-otf-v2024.05.12.zip
fusion-pixel-font-8px-monospaced-pcf-v2024.05.12.zip
fusion-pixel-font-8px-monospaced-ttc-v2024.05.12.zip
fusion-pixel-font-8px-monospaced-ttf-v2024.05.12.zip
fusion-pixel-font-8px-monospaced-woff2-v2024.05.12.zip
fusion-pixel-font-8px-proportional-bdf-v2024.05.12.zip
fusion-pixel-font-8px-proportional-otc-v2024.05.12.zip
fusion-pixel-font-8px-proportional-otf-v2024.05.12.zip
fusion-pixel-font-8px-proportional-pcf-v2024.05.12.zip
fusion-pixel-font-8px-proportional-ttc-v2024.05.12.zip
fusion-pixel-font-8px-proportional-ttf-v2024.05.12.zip
fusion-pixel-font-8px-proportional-woff2-v2024.05.12.zip
*/

// create projects for each variant
// fusion-pixel-font-?px-monospaced
// fusion-pixel-font-?px-proportional
let variants = new Set();
let version = null;
for await (const file of $`gh release view --repo ${REPO} --json assets -q '.assets[].name'`.lines()) {
  let match = file.match(/^fusion-pixel-font-(\d+)px-(\w+)-(\w+)-(v\d{4}\.\d{2}\.\d{2})\.zip$/);
  if (match) {
    let [_, size, style, format, v] = match;
    if (format !== "woff2") continue;
    version = v;
    variants.add({
      size: parseInt(size),
      style,
      id: `${size}px-${style}`,
      asset: file,
    });
  }
}
if (!version) {
  console.error("No version found");
  process.exit(1);
}
variants = Array.from(variants).sort();
// console.log(variants);

// run `npx fontsource create` for each variant

try {
  await $`rm -r fusion-pixel-10px-monospaced`;
} catch (e) { }


await Promise.all(variants.map(processVariant));

async function processVariant(variant) {
  // use grep to replace all placeholders to our actual values
  const id = "fusion-pixel-" + variant.id;
  const name = `Fusion Pixel ${variant.size}px ${variant.style === "monospaced" ? "Monospaced" : "Proportional"}`;
  const pkg = "./" + id;

  // 1. Copy the placeholder package to the new package
  await $`cp -r ${PLACEHOLDER_PACKAGE} ${pkg}`;
  // 2. Replace all placeholders in the new package
  await $`grep -rl ${NAME_PLACEHOLDER} ${pkg} | xargs sed -i '' -e 's/${NAME_PLACEHOLDER}/${name}/g'`;
  await $`grep -rl ${ID_PLACEHOLDER} ${pkg} | xargs sed -i '' -e 's/${ID_PLACEHOLDER}/${id}/g'`;
  await $`grep -rl ${VERSION_PLACEHOLDER} ${pkg} | xargs sed -i '' -e 's/${VERSION_PLACEHOLDER}/${version}/g'`;

  // 3. Download the font zip to the ${pkg}/files
  console.log(`Downloading ${variant.asset} to ${pkg}/files`);
  await $`gh release download --repo TakWolf/fusion-pixel-font --pattern ${variant.asset} --dir ${pkg}/files --clobber`;
  const ttfAsset = variant.asset.replace("-woff2-", "-ttf-");
  await $`gh release download --repo TakWolf/fusion-pixel-font --pattern ${ttfAsset} --dir ${pkg}/files --clobber`;
  // 4. Unzip the font zip
  await $`unzip ${pkg}/files/${variant.asset} -d ${pkg}/files`;
  await $`rm ${pkg}/files/${variant.asset}`;
  await $`unzip -n ${pkg}/files/${ttfAsset} -d ${pkg}/files`;
  await $`rm ${pkg}/files/${ttfAsset}`;
  // 5. Set license: Move ${pkg}/files/OFL.txt to ${pkg}/LICENSE,
  // and read all texts in ${pkg}/files/LICENSE/*.txt and append them to ${pkg}/LICENSE splitted by double newline
  await $`mv ${pkg}/files/OFL.txt ${pkg}/LICENSE`;
  await $`cat ${pkg}/files/LICENSE/*.txt | awk 'NR>1{print ""}1' >> ${pkg}/LICENSE`;
  await $`rm -r ${pkg}/files/LICENSE`;

  // 6. Rename font files to fusion-pixel-font-?px-[style]-[locale]-400-normal.woff
  let files = await fs.readdir(`${pkg}/files`);
  for (let file of files) {
    let match = file.match(/-([a-z_]+)\.woff2$/);
    if (match) {
      let locale = match[1];
      locale = LOCALES_MAP[locale] || locale;
      let newfile = `fusion-pixel-${variant.size}px-${variant.style}-${locale}-400-normal.woff2`;
      console.log(`Renaming ${file} to ${newfile}`);
      await fs.rename(`${pkg}/files/${file}`, `${pkg}/files/${newfile}`);
    }
  }

  // 7. Create woff1 from ttf
  for (let file of files) {
    let match = file.match(/-([a-z_]+)\.ttf$/);
    if (match) {
      let locale = match[1];
      locale = LOCALES_MAP[locale] || locale;
      let newfile = `fusion-pixel-${variant.size}px-${variant.style}-${locale}-400-normal.woff`;
      console.log(`Converting ${file} to ${newfile}`);
      await $`ttf2woff ${pkg}/files/${file} ${pkg}/files/${newfile}`;
      await fs.unlink(`${pkg}/files/${file}`);
    }
  }
}
