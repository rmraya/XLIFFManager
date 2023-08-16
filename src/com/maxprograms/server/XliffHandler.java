/*******************************************************************************
 * Copyright (c) 2023 Maxprograms.
 *
 * This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License 1.0
 * which accompanies this distribution, and is available at
 * https://www.eclipse.org/org/documents/epl-v10.html
 *
 * Contributors:
 *     Maxprograms - initial API and implementation
 *******************************************************************************/

package com.maxprograms.server;

import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.lang.System.Logger;
import java.lang.System.Logger.Level;
import java.net.URI;
import java.net.URISyntaxException;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.text.MessageFormat;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;

import javax.xml.parsers.ParserConfigurationException;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.xml.sax.SAXException;

import com.maxprograms.converters.ApproveAll;
import com.maxprograms.converters.Convert;
import com.maxprograms.converters.CopySources;
import com.maxprograms.converters.EncodingResolver;
import com.maxprograms.converters.FileFormats;
import com.maxprograms.converters.Merge;
import com.maxprograms.converters.PseudoTranslation;
import com.maxprograms.converters.RemoveTargets;
import com.maxprograms.converters.TmxExporter;
import com.maxprograms.converters.sdlppx.Sdlppx2Xliff;
import com.maxprograms.converters.xliff.XliffUtils;
import com.maxprograms.languages.Language;
import com.maxprograms.languages.LanguageUtils;
import com.maxprograms.stats.RepetitionAnalysis;
import com.maxprograms.validation.XliffChecker;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

public class XliffHandler implements HttpHandler {

	private static final String RESULT = "result";
	private static final String SUCCESS = "Success";
	private static final String FAILED = "Failed";
	private static final String REASON = "reason";
	private static final String RUNNING = "running";
	private static final String COMPLETED = "completed";

	private static Logger logger = System.getLogger(XliffHandler.class.getName());

	private Map<String, String> processMap;
	private Map<String, JSONObject> validationResults;
	private Map<String, JSONObject> conversionResults;
	private Map<String, JSONObject> mergeResults;
	private Map<String, JSONObject> analysisResults;
	private Map<String, JSONObject> tasksResults;
	private String xliff;
	private String catalog;
	private String target;
	private boolean unapproved;
	private boolean exportTmx;

	public XliffHandler() {
		processMap = new HashMap<>();
		validationResults = new HashMap<>();
		conversionResults = new HashMap<>();
		mergeResults = new HashMap<>();
		analysisResults = new HashMap<>();
		tasksResults = new HashMap<>();
	}

	@Override
	public void handle(HttpExchange exchange) throws IOException {
		URI uri = exchange.getRequestURI();
		String request = "";
		try (InputStream is = exchange.getRequestBody()) {
			request = readRequestBody(is);
		}

		JSONObject json = null;
		String response = "";
		String command = "version";
		try {
			if (uri.toString().endsWith("/stop")) {
				command = "stop";
				response = "{\"stopping\": \"now!\"}";
			}
			if (!request.isBlank()) {
				json = new JSONObject(request);
				command = json.getString("command");
			}
			if (command.equals("version")) {
				JSONObject result = new JSONObject();
				MessageFormat mf = new MessageFormat(Messages.getString("XliffHandler.11"));
				result.put("XLIFFManager", mf.format(new String[] { Constants.VERSION, Constants.BUILD }));
				result.put("OpenXLIFF", mf.format(new String[] { com.maxprograms.converters.Constants.VERSION,
						com.maxprograms.converters.Constants.BUILD }));
				result.put("XMLJava", mf.format(
						new String[] { com.maxprograms.xml.Constants.VERSION, com.maxprograms.xml.Constants.BUILD }));
				result.put("Java", mf.format(
						new String[] { System.getProperty("java.version"), System.getProperty("java.vendor") }));
				response = result.toString(2);
			}
			if (command.equals("convert")) {
				response = convert(json);
			}
			if (command.equals("merge")) {
				response = merge(json);
			}
			if (command.equals("status")) {
				response = getStatus(json);
			}
			if (command.equals("validationResult")) {
				response = getValidationResult(json);
			}
			if (command.equals("conversionResult")) {
				response = getConversionResult(json);
			}
			if (command.equals("mergeResult")) {
				response = getMergeResult(json);
			}
			if (command.equals("analysisResult")) {
				response = getAnalysisResult(json);
			}
			if (command.equals("getFileType")) {
				response = getFileType(json);
			}
			if (command.equals("getTargetFile")) {
				response = getTargetFile(json);
			}
			if (command.equals("validateXliff")) {
				response = validateXliff(json);
			}
			if (command.equals("analyseXliff")) {
				response = analyseXliff(json);
			}
			if (command.equals("getTypes") || uri.toString().endsWith("/getTypes")) {
				response = getTypes();
			}
			if (command.equals("getCharsets") || uri.toString().endsWith("/getCharsets")) {
				response = getCharsets();
			}
			if (command.equals("getLanguages") || uri.toString().endsWith("/getLanguages")) {
				response = getLanguages();
			}
			if (command.equals("getPackageLangs")) {
				response = getPackageLangs(json);
			}
			if (command.equals("getXliffLangs")) {
				response = getXliffLangs(json);
			}
			if (command.equals("copySources") || command.equals("pseudoTranslate") ||
					command.equals("removeTargets") || command.equals("approveAll")) {
				response = processTasks(json);
			}
			if (command.equals("tasksResult")) {
				response = tasksResult(json);
			}
			byte[] bytes = response.getBytes(StandardCharsets.UTF_8);
			exchange.getResponseHeaders().add("content-type", "application/json");
			exchange.sendResponseHeaders(200, bytes.length);
			try (OutputStream os = exchange.getResponseBody()) {
				os.write(bytes);
			}
		} catch (IOException | SAXException | ParserConfigurationException e) {
			response = e.getMessage();
			byte[] bytes = response.getBytes(StandardCharsets.UTF_8);
			exchange.sendResponseHeaders(500, bytes.length);
			try (OutputStream os = exchange.getResponseBody()) {
				os.write(bytes);
			}
		}
	}

	private String tasksResult(JSONObject json) {
		JSONObject result = new JSONObject();
		String process = "";
		if (json.has("process")) {
			process = json.getString("process");
		}
		if (tasksResults.containsKey(process)) {
			result = tasksResults.get(process);
			tasksResults.remove(process);
		} else {
			result.put(RESULT, FAILED);
			result.put(REASON, Messages.getString("XliffHandler.0"));
		}
		return result.toString(2);
	}

	private String processTasks(final JSONObject json) {
		String process = "" + System.currentTimeMillis();
		new Thread(() -> {
			processMap.put(process, RUNNING);
			JSONObject jsonResult = new JSONObject();
			try {
				switch (json.getString("command")) {
					case "approveAll":
						ApproveAll.approveAll(json.getString("file"), json.getString("catalog"));
						break;
					case "removeTargets":
						RemoveTargets.removeTargets(json.getString("file"), json.getString("catalog"));
						break;
					case "pseudoTranslate":
						PseudoTranslation.pseudoTranslate(json.getString("file"), json.getString("catalog"));
						break;
					case "copySources":
						CopySources.copySources(json.getString("file"), json.getString("catalog"));
						break;
					default:
						throw new IOException("Unknown task");
				}
				jsonResult.put(RESULT, SUCCESS);
			} catch (IOException | JSONException | SAXException | ParserConfigurationException
					| URISyntaxException e) {
				jsonResult.put(RESULT, FAILED);
				jsonResult.put(REASON, e.getMessage());
			}
			tasksResults.put(process, jsonResult);
			if (processMap.get(process).equals((RUNNING))) {
				processMap.put(process, COMPLETED);
			}
		}).start();
		return "{\"process\":\"" + process + "\"}";
	}

	private static String getPackageLangs(JSONObject json) {
		try {
			return Sdlppx2Xliff.getPackageLanguages(json.getString("package")).toString();
		} catch (JSONException | IOException | SAXException | ParserConfigurationException e) {
			JSONObject error = new JSONObject();
			error.put(RESULT, FAILED);
			error.put(REASON, e.getMessage());
			return error.toString();
		}
	}

	private static String getXliffLangs(JSONObject json) {
		try {
			File xliff = new File(json.getString("xliff"));
			return XliffUtils.getXliffLanguages(xliff).toString();
		} catch (JSONException | IOException | SAXException | ParserConfigurationException e) {
			JSONObject error = new JSONObject();
			error.put(RESULT, FAILED);
			error.put(REASON, e.getMessage());
			return error.toString();
		}
	}

	private static String readRequestBody(InputStream is) throws IOException {
		StringBuilder request = new StringBuilder();
		try (BufferedReader rd = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8))) {
			String line;
			while ((line = rd.readLine()) != null) {
				request.append(line);
			}
		}
		return request.toString();
	}

	private String merge(JSONObject json) {
		xliff = "";
		if (json.has("xliff")) {
			xliff = json.getString("xliff");
		}
		target = "";
		if (json.has("target")) {
			target = json.getString("target");
		}
		catalog = "";
		if (json.has("catalog")) {
			catalog = json.getString("catalog");
		}
		if (catalog.isEmpty()) {
			File catalogFolder = new File(new File(System.getProperty("user.dir")), "catalog");
			catalog = new File(catalogFolder, "catalog.xml").getAbsolutePath();
		}
		unapproved = false;
		if (json.has("unapproved")) {
			unapproved = json.getBoolean("unapproved");
		}
		exportTmx = false;
		if (json.has("exportTmx")) {
			exportTmx = json.getBoolean("exportTmx");
		}
		String process = "" + System.currentTimeMillis();
		new Thread(() -> {
			processMap.put(process, RUNNING);
			List<String> result = Merge.merge(xliff, target, catalog, unapproved);
			if (exportTmx && Constants.SUCCESS.equals(result.get(0))) {
				String tmx = "";
				if (xliff.toLowerCase().endsWith(".xlf")) {
					tmx = xliff.substring(0, xliff.lastIndexOf('.')) + ".tmx";
				} else {
					tmx = xliff + ".tmx";
				}
				result = TmxExporter.export(xliff, tmx, catalog);
			}
			JSONObject jsonResult = new JSONObject();
			if (Constants.SUCCESS.equals(result.get(0))) {
				jsonResult.put(RESULT, SUCCESS);
			} else {
				jsonResult.put(RESULT, FAILED);
				jsonResult.put(REASON, result.get(1));
			}
			mergeResults.put(process, jsonResult);
			if (processMap.get(process).equals((RUNNING))) {
				processMap.put(process, COMPLETED);
			}
		}).start();
		return "{\"process\":\"" + process + "\"}";
	}

	private String convert(JSONObject json) throws JSONException, IOException {
		String source = "";
		if (json.has("file")) {
			source = json.getString("file");
		}
		String srcLang = "";
		if (json.has("srcLang")) {
			srcLang = json.getString("srcLang");
		}
		String tgtLang = "";
		if (json.has("tgtLang")) {
			tgtLang = json.getString("tgtLang");
		}
		xliff = source + ".xlf";
		if (json.has("xliff")) {
			xliff = json.getString("xliff");
		}
		String skl = source + ".skl";
		if (json.has("sklFolder")) {
			File sklFolder = new File(json.getString("sklFolder"));
			if (!sklFolder.exists()) {
				try {
					Files.createDirectories(sklFolder.toPath());
				} catch (IOException e) {
					MessageFormat mf = new MessageFormat(Messages.getString("XliffHandler.1"));
					throw new IOException(mf.format(new String[] { json.getString("sklFolder") }));
				}
			}
			try {
				File tmp = File.createTempFile(new File(source).getName(), ".skl", sklFolder);
				skl = tmp.getAbsolutePath();
			} catch (IOException e) {
				throw new IOException(Messages.getString("XliffHandler.2"), e);
			}
		}
		if (json.has("skl")) {
			skl = json.getString("skl");
		}
		String type = "";
		if (json.has("type")) {
			type = json.getString("type");
			String fullName = FileFormats.getFullName(type);
			if (fullName != null) {
				type = fullName;
			}
		}
		if (type.isEmpty()) {
			String detected = FileFormats.detectFormat(source);
			if (detected != null) {
				type = detected;
				MessageFormat mf = new MessageFormat(Messages.getString("XliffHandler.3"));
				logger.log(Level.INFO, mf.format(new String[] { type }));
			} else {
				throw new IOException(Messages.getString("XliffHandler.4"));
			}
		}
		String enc = "";
		if (json.has("enc")) {
			enc = json.getString("enc");
		}
		if (enc.isEmpty()) {
			Charset charset = EncodingResolver.getEncoding(source, type);
			if (charset != null) {
				enc = charset.name();
				MessageFormat mf = new MessageFormat(Messages.getString("XliffHandler.5"));
				logger.log(Level.INFO, mf.format(new String[] { enc }));
			} else {
				throw new IOException(Messages.getString("XliffHandler.6"));
			}
		}
		String srx = "";
		if (json.has("srx")) {
			srx = json.getString("srx");
		}
		if (srx.isEmpty()) {
			File srxFolder = new File(new File(System.getProperty("user.dir")), "srx");
			srx = new File(srxFolder, "default.srx").getAbsolutePath();
		}
		catalog = "";
		if (json.has("catalog")) {
			catalog = json.getString("catalog");
		}
		if (catalog.isEmpty()) {
			File catalogFolder = new File(new File(System.getProperty("user.dir")), "catalog");
			catalog = new File(catalogFolder, "catalog.xml").getAbsolutePath();
		}
		String ditaval = "";
		if (json.has("ditaval")) {
			ditaval = json.getString("ditaval");
		}
		String config = "";
		if (json.has("config")) {
			config = json.getString("config");
		}
		boolean embed = false;
		if (json.has("embed")) {
			embed = json.getBoolean("embed");
		}
		boolean paragraph = false;
		if (json.has("paragraph")) {
			paragraph = json.getBoolean("paragraph");
		}
		boolean is20 = false;
		if (json.has("is20")) {
			is20 = json.getBoolean("is20");
		}
		String process = "" + System.currentTimeMillis();

		File xmlfilter = new File(new File(System.getProperty("user.dir")), "xmlfilter");

		Map<String, String> params = new HashMap<>();
		params.put("source", source);
		params.put("srcLang", srcLang);
		params.put("xliff", xliff);
		params.put("skeleton", skl);
		params.put("format", type);
		params.put("catalog", catalog);
		params.put("srcEncoding", enc);
		params.put("paragraph", paragraph ? "yes" : "no");
		params.put("srxFile", srx);
		params.put("xmlfilter", xmlfilter.getAbsolutePath());
		params.put("xliff20", is20 ? "yes" : "no");
		params.put("embed", embed ? "yes" : "no");
		if (!tgtLang.isEmpty()) {
			params.put("tgtLang", tgtLang);
		}
		if (type.equals(FileFormats.DITA) && !ditaval.isEmpty()) {
			params.put("ditaval", ditaval);
		}
		if (type.equals(FileFormats.JSON) && !config.isEmpty()) {
			params.put("config", config);
		}
		if (is20 && !paragraph && config.isEmpty()) {
			params.put("resegment", "yes");
			params.put("paragraph", "yes");
		}

		new Thread(() -> {
			processMap.put(process, RUNNING);
			List<String> result = Convert.run(params);
			JSONObject jsonResult = new JSONObject();
			if (Constants.SUCCESS.equals(result.get(0))) {
				jsonResult.put(RESULT, SUCCESS);
			} else {
				jsonResult.put(RESULT, FAILED);
				jsonResult.put(REASON, result.get(1));
			}
			conversionResults.put(process, jsonResult);
			if (processMap.get(process).equals((RUNNING))) {
				processMap.put(process, COMPLETED);
			}
		}).start();
		return "{\"process\":\"" + process + "\"}";
	}

	private static String getFileType(JSONObject json) {
		String file = json.getString("file");
		String type = "Unknown";
		String encoding = "Unknown";
		String detected = FileFormats.detectFormat(file);
		if (detected != null) {
			type = FileFormats.getShortName(detected);
			if (type != null) {
				Charset charset = EncodingResolver.getEncoding(file, detected);
				if (charset != null) {
					encoding = charset.name();
				}
			}
		}
		if (encoding.equals("Unknown")) {
			try {
				Charset bom = EncodingResolver.getBOM(file);
				if (bom != null) {
					encoding = bom.name();
				}
			} catch (IOException e) {
				// ignore
			}
		}
		JSONObject result = new JSONObject();
		result.put("file", file);
		result.put("type", type);
		result.put("encoding", encoding);
		return result.toString();
	}

	private static String getTypes() {
		String[] formats = FileFormats.getFormats();
		List<FileType> types = new ArrayList<>();
		for (int i = 0; i < formats.length; i++) {
			String code = FileFormats.getShortName(formats[i]);
			String description = FileFormats.getLocalizedName(formats[i]);
			types.add(new FileType(code, description));
		}
		Collections.sort(types);
		StringBuilder builder = new StringBuilder();
		builder.append("{\"types\": [\n");
		for (int i = 0; i < types.size(); i++) {
			FileType type = types.get(i);
			if (i > 0) {
				builder.append(",\n");
			}
			builder.append("{\"type\":\"");
			builder.append(type.getCode());
			builder.append("\", \"description\":\"");
			builder.append(type.getDescription());
			builder.append("\"}");
		}
		builder.append("]}\n");
		return builder.toString();
	}

	private static String getLanguages() throws SAXException, IOException, ParserConfigurationException {
		List<Language> languages = LanguageUtils.getCommonLanguages();
		StringBuilder builder = new StringBuilder();
		builder.append("{\"languages\": [\n");
		for (int i = 0; i < languages.size(); i++) {
			Language lang = languages.get(i);
			if (i > 0) {
				builder.append(",\n");
			}
			builder.append("{\"code\":\"");
			builder.append(lang.getCode());
			builder.append("\", \"description\":\"");
			builder.append(lang.getDescription());
			builder.append("\"}");
		}
		builder.append("]}\n");
		return builder.toString();
	}

	private String getAnalysisResult(JSONObject json) {
		JSONObject result = new JSONObject();
		String process = "";
		if (json.has("process")) {
			process = json.getString("process");
		}
		if (analysisResults.containsKey(process)) {
			result = analysisResults.get(process);
			analysisResults.remove(process);
		} else {
			result.put(RESULT, FAILED);
			result.put(REASON, Messages.getString("XliffHandler.0"));
		}
		return result.toString(2);
	}

	private String getMergeResult(JSONObject json) {
		JSONObject result = new JSONObject();
		String process = "";
		if (json.has("process")) {
			process = json.getString("process");
		}
		if (mergeResults.containsKey(process)) {
			result = mergeResults.get(process);
			mergeResults.remove(process);
		} else {
			result.put(RESULT, FAILED);
			result.put(REASON, Messages.getString("XliffHandler.0"));
		}
		return result.toString(2);
	}

	private String getConversionResult(JSONObject json) {
		JSONObject result = new JSONObject();
		String process = "";
		if (json.has("process")) {
			process = json.getString("process");
		}
		if (conversionResults.containsKey(process)) {
			result = conversionResults.get(process);
			conversionResults.remove(process);
		} else {
			result.put(RESULT, FAILED);
			result.put(REASON, Messages.getString("XliffHandler.0"));
		}
		return result.toString(2);
	}

	private String analyseXliff(JSONObject json) {
		String file = json.getString("file");
		catalog = "";
		if (json.has("catalog")) {
			catalog = json.getString("catalog");
		}
		if (catalog.isEmpty()) {
			File catalogFolder = new File(new File(System.getProperty("user.dir")), "catalog");
			catalog = new File(catalogFolder, "catalog.xml").getAbsolutePath();
		}

		String process = "" + System.currentTimeMillis();
		new Thread(() -> {
			processMap.put(process, RUNNING);
			List<String> result = new ArrayList<>();
			try {
				RepetitionAnalysis instance = new RepetitionAnalysis();
				instance.analyse(file, catalog);
				logger.log(Level.INFO, "Analysis completed");
				result.add(Constants.SUCCESS);
			} catch (IOException | SAXException | ParserConfigurationException | URISyntaxException e) {
				logger.log(Level.ERROR, "Error analysing file", e);
				result.add(Constants.ERROR);
				result.add(e.getMessage());
			}
			JSONObject jsonResult = new JSONObject();
			if (Constants.SUCCESS.equals(result.get(0))) {
				jsonResult.put(RESULT, SUCCESS);
			} else {
				jsonResult.put(RESULT, FAILED);
				jsonResult.put(REASON, result.get(1));
			}
			analysisResults.put(process, jsonResult);
			processMap.put(process, COMPLETED);
		}).start();
		return "{\"process\":\"" + process + "\"}";
	}

	private String validateXliff(JSONObject json) {
		String file = json.getString("file");
		catalog = "";
		if (json.has("catalog")) {
			catalog = json.getString("catalog");
		}
		if (catalog.isEmpty()) {
			File catalogFolder = new File(new File(System.getProperty("user.dir")), "catalog");
			catalog = new File(catalogFolder, "catalog.xml").getAbsolutePath();
		}

		String process = "" + System.currentTimeMillis();
		new Thread(() -> {
			processMap.put(process, RUNNING);
			try {
				XliffChecker validator = new XliffChecker();
				boolean valid = validator.validate(file, catalog);
				JSONObject result = new JSONObject();
				result.put("valid", valid);
				if (valid) {
					String version = validator.getVersion();
					MessageFormat mf = new MessageFormat(Messages.getString("XliffHandler.7"));
					result.put("comment", mf.format(new String[] { version }));
				} else {
					String reason = validator.getReason();
					result.put(REASON, reason);
				}
				validationResults.put(process, result);
				if (processMap.get(process).equals((RUNNING))) {
					logger.log(Level.INFO, Messages.getString("XliffHandler.8"));
					processMap.put(process, COMPLETED);
				}
			} catch (IOException e) {
				logger.log(Level.ERROR, Messages.getString("XliffHandler.9"), e);
				processMap.put(process, e.getMessage());
			}
		}).start();
		return "{\"process\":\"" + process + "\"}";
	}

	private static String getTargetFile(JSONObject json) {
		JSONObject result = new JSONObject();
		String file = json.getString("file");
		String target = "";
		try {
			target = Merge.getTargetFile(file);
			if (target.isEmpty()) {
				target = "Unknown";
			}
			result.put(RESULT, SUCCESS);
		} catch (IOException | SAXException | ParserConfigurationException e) {
			logger.log(Level.ERROR, Messages.getString("XliffHandler.10"), e);
			result.put(RESULT, FAILED);
			result.put(REASON, e.getMessage());
		}
		result.put("target", target);
		return result.toString();
	}

	private static String getCharsets() {
		JSONObject result = new JSONObject();
		JSONArray array = new JSONArray();
		result.put("charsets", array);
		TreeMap<String, Charset> charsets = new TreeMap<>(Charset.availableCharsets());
		Set<String> keys = charsets.keySet();
		Iterator<String> i = keys.iterator();
		while (i.hasNext()) {
			Charset cset = charsets.get(i.next());
			JSONObject charset = new JSONObject();
			charset.put("code", cset.name());
			charset.put("description", cset.displayName());
			array.put(charset);
		}
		return result.toString(2);
	}

	private String getStatus(JSONObject json) {
		String status = "unknown";
		if (json.has("process")) {
			String process = json.getString("process");
			status = processMap.get(process);
		}
		if (status == null) {
			status = "Error";
		}
		return "{\"status\": \"" + status + "\"}";
	}

	private String getValidationResult(JSONObject json) {
		JSONObject result = new JSONObject();
		String process = "";
		if (json.has("process")) {
			process = json.getString("process");
		}
		if (validationResults.containsKey(process)) {
			result = validationResults.get(process);
			validationResults.remove(process);
		} else {
			result.put("valid", false);
			result.put(REASON, Messages.getString("XliffHandler.0"));
		}
		return result.toString(2);
	}

}