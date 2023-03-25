# XLIFF Manager Localization

Localizing XLIFF Manager requires processing 3 types of files:

1. Java .properties files
2. TypeScript strings in JSON format
3. Documentation from DITA files

## Localization of Java .properties

[javaPM](https://www.maxprograms.com/products/javapm.html) is used to generate XLIFF from `/src` folder.

## Localization of TypeScript strings

XLIFF Manager can be used to generate to generate XLIFF from the JSON files stored in `/i18n` folder.

- Use `/i189/filterConfig.json` when generating XLIFF to handle `'&'` signs used in menu names as regular characters instead of HTML entities.
- Select *Paragraph Segmentation* to avoid splitting strings at inconvenient places.
- Select *Export Approved Segments as TMX* when merging the translated XLIFF and then reuse those translations when processing the User Guide.

## Localization of DITA manuals

- Use XLIFF Manager to generate XLIFF from the DITA maps stored in `/docs` folder.
- Use [Conversa DITA Publisher](https://www.maxprograms.com/products/conversa.html) to publish the translated DITA maps as PDF.
