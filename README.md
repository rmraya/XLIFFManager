# XLIFF Manager

![XLIFF Manager logo](img/xliffmanager.png)

A graphical user interface (GUI) for [OpenXLIFF Filters](https://github.com/maxprograms-com/OpenXLIFF). OpenXLIFF is a set of programs that let you:

- Create XLIFF 1.2, 2.0, 2.1 and 2.2 files that can be translated in any modern CAT tool.
- Convert your translated XLIFF files to original format with a couple of clicks.
- Validate XLIFF files created by any tool. Validation is supported for XLIFF 1.0, 1.1, 1.2 and 2.0.
- Produce an HTML file with word counts and segment status statistics from an XLIFF document.

## Supported File Formats

With XLIFF Manager you can create XLIFF for all formats supported by OpenXLIFF Filters:

- **General Documentation**
  - Adobe InCopy ICML
  - Adobe InDesign Interchange (INX)
  - Adobe InDesign IDML CS4, CS5, CS6 & CC
  - HTML
  - Microsoft Office (2007 and newer)
  - Microsoft Visio XML Drawings (2007 and newer)
  - MIF (Maker Interchange Format)
  - OpenOffice / LibreOffice / StarOffice
  - Plain Text
  - SDLXLIFF (Trados Studio)
  - SRT Subtitles
  - Trados Studio Packages (*.sdlppx)
  - TXML (GlobalLink/Wordfast PRO)
  - WPML XLIFF (WordPress Multilingual Plugin)
  - XLIFF from Other Tools (.mqxliff, .txlf, .xliff, etc.)
- **XML Formats**
  - XML (Generic)
  - DITA 1.0, 1.1, 1.2 and 1.3
  - DocBook 3.x, 4.x and 5.x
  - SVG
  - Word 2003 ML
  - XHTML
- **Software Development**
  - JavaScript
  - JSON
  - Java Properties
  - PO (Portable Objects)
  - RC (Windows C/C++ Resources)
  - ResX (Windows .NET Resources)
  - TS (Qt Linguist translation source)

## Downloads

You can get ready to use installers of XLIFF Manager for Windows, macOS and Linux from [https://www.maxprograms.com/products/xliffmanager.html](https://www.maxprograms.com/products/xliffmanager.html).

## Documentation

- [XLIFF Manager User Guide](https://www.maxprograms.com/support/xliffmanager.pdf) (PDF)
- [XLIFF Manager User Guide](https://www.maxprograms.com/support/xliffmanager.html) (Web Help)

## Licenses

XLIFF Manager is available in two modes:

- Source Code
- Yearly Subscriptions for installers and support

### Source Code

Source code of XLIFF Manager is free. Anyone can download the source code, compile, modify and use it at no cost in compliance with the accompanying license terms.

You can subscribe to [Maxprograms Support](https://groups.io/g/maxprograms/) at Groups.io and request peer assistance for the source code version there.

### Subscriptions

The version of XLIFF Manager included in the official installers from [Maxprograms Download Page](https://maxprograms.com/products/xliffdownload.html) can be used at no cost for 7 days requesting a free Evaluation Key.

Personal Subscription Keys are available in  [Maxprograms Online Store](https://www.maxprograms.com/store/buy.html).

Subscription Keys cannot be shared or transferred to different machines.

Installers may occasionally be updated before the corresponding source code changes appear in this repository. Source code updates are published later, once they are ready for release. This timing difference is expected and does not affect the availability or completeness of the source code.

Subscription version includes unlimited email support at [tech@maxprograms.com](mailto:tech@maxprograms.com)

### Differences sumary

Differences | Source Code | Subscription Based
----------- | :---------: | :-----------------:
Ready To Use Installers | No | Yes
Notarized macOS launcher | No | Yes
Signed launcher and installer for Windows | No | Yes
Restricted Features | None | None
Technical Support | Peer support at [Groups.io](https://groups.io/g/maxprograms/) | - Direct email at [tech@maxprograms.com](mailto:tech@maxprograms.com)  <br> - Peer support at [Groups.io](https://groups.io/g/maxprograms/)

## Requirements

- Node.js 24.14.0 LTS or newer. Get it from [https://nodejs.org/](https://nodejs.org/)
- OpenXLIFF Filters 5.0.0 or newer. Get it from [https://github.com/maxprograms-com/OpenXLIFF](https://github.com/maxprograms-com/OpenXLIFF)

## Building

- Clone and build [OpenXLIFF Filters](https://github.com/maxprograms-com/OpenXLIFF).
- Clone this repository.
- Copy `dist` folder from OpenXLIFF Filters to the root of this repository.
- Run `npm install` to download and install NodeJS dependencies
- Run `npm start` to launch XLIFF Manager

### Steps for building

``` bash
  git clone https://github.com/maxprograms-com/OpenXLIFF.git
  cd OpenXLIFF
  gradle
  cd ..
  git clone https://github.com/maxprograms-com/XLIFFManager.git
  cd XLIFFManager
  cp -r ../OpenXLIFF/dist/* .
  npm install
  npm start
```
