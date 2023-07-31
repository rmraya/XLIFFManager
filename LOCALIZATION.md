# XLIFF Manager Localization

Localizing XLIFF Manager requires processing 4 types of files:

1. Java `.properties` files
2. TypeScript strings in JSON format
3. HTML files for the main UI
4. Documentation from DITA files

## Localization of Java .properties

[JavaPM](https://www.maxprograms.com/products/javapm.html) is used to generate XLIFF from `/src` folder.

Use a command like this to generate XLIFF:

```bash
/path-to-Javapm/createxliff.sh -src XLIFFManager/src -xliff yourXliffFile.xlf -srcLang en -tgtLang fr -enc UTF-8
```

XLIFF Manager .properties are encoded in UTF-8; translated versions must be generated using UTF-8 character set.

XLIFF Manager uses code from these two projects:

- [OpenXLIFF Filters](https://github.com/rmraya/OpenXLIFF)  
- [XMLJava](https://github.com/rmraya/XMLJava)

It is important to localize those projects and include localized versions of the libraries in the XLIFF Manager project for proper display of error messages and other user interface elements, like language names.

## Localization of TypeScript strings

XLIFF Manager can be used to generate to generate XLIFF from the JSON files stored in `/i18n` folder.

- Use `/i189/filterConfig.json` when generating XLIFF to handle `'&'` signs used in menu names as regular characters instead of HTML entities.
- Select *Paragraph Segmentation* to avoid splitting strings at inconvenient places.
- Select *Export Approved Segments as TMX* when merging the translated XLIFF and then reuse those translations when processing the User Guide.

## Localization of HTML files

You can generate XLIFF from the HTML files available in `/html` folder using XLIFF Manager.

It is suggested to translate HTML before the DITA manuals because you will need the translations of all labels and you would need to capture new screenshots from the translated UI.

## Localization of DITA manuals

Although you can use XLIFF Manager to generate XLIFF from the DITA maps stored in `/docs` folder, it is stronly suggested to use [Fluenta](https://www.maxprograms.com/products/fluenta.html) for processing the manuals. Fluenta offers enhanced methods for reusing translations when the manual is updated.

Use [Conversa DITA Publisher](https://www.maxprograms.com/products/conversa.html) to publish the translated DITA maps as PDF.
