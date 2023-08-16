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

import java.io.File;
import java.io.IOException;
import java.lang.System.Logger;
import java.lang.System.Logger.Level;
import java.net.InetSocketAddress;
import java.nio.file.Files;
import java.text.MessageFormat;
import java.util.Locale;

import javax.xml.parsers.ParserConfigurationException;

import org.xml.sax.SAXException;

import com.maxprograms.converters.Constants;
import com.maxprograms.languages.LanguageUtils;
import com.sun.net.httpserver.HttpServer;

public class FilterServer {

	private static Logger logger = System.getLogger(FilterServer.class.getName());

	private HttpServer server;
	private static File workDir;

	public static void main(String[] args) {
		String port = "8000";
		for (int i = 0; i < args.length; i++) {
			String arg = args[i];
			if (arg.equals("-version")) {
				MessageFormat mf = new MessageFormat(Messages.getString("FilterServer.0"));
				logger.log(Level.INFO, () -> mf.format(new String[] { Constants.VERSION, Constants.BUILD }));
				return;
			}
			if (arg.equals("-port") && (i + 1) < args.length) {
				port = args[i + 1];
			}
			if (arg.equals("-lang") && (i + 1) < args.length) {
				String lang = args[i + 1];
				try {
					if (LanguageUtils.getLanguage(lang) != null) {
						Locale locale = new Locale(lang);
						Locale.setDefault(locale);
					}
				} catch (IOException | SAXException | ParserConfigurationException e) {
					logger.log(Level.WARNING, e);
				}
			}
		}
		try {
			FilterServer instance = new FilterServer(Integer.valueOf(port));
			instance.run();
		} catch (Exception e) {
			logger.log(Level.ERROR, Messages.getString("FilterServer.1"), e);
		}
	}

	public FilterServer(int port) throws IOException {
		server = HttpServer.create(new InetSocketAddress(port), 0);
		XliffHandler handler = new XliffHandler();
		server.createContext("/FilterServer", handler);
		server.setExecutor(null); // creates a default executor
	}

	public void run() {
		server.start();
		logger.log(Level.INFO, Messages.getString("FilterServer.2"));
	}

	public void stop() {
		server.removeContext("/FilterServer");
		logger.log(Level.INFO, Messages.getString("FilterServer.3"));
		System.exit(0);
	}

	public static File getWorkFolder() throws IOException {
		if (workDir == null) {
			String os = System.getProperty("os.name").toLowerCase();
			if (os.startsWith("mac")) {
				workDir = new File(System.getProperty("user.home") + "/Library/Application Support/XLIFF Manager/");
			} else if (os.startsWith("windows")) {
				workDir = new File(System.getenv("AppData") + "\\XLIFF Manager\\");
			} else {
				workDir = new File(System.getProperty("user.home") + "/.config/XLIFF Manager/");
			}
			if (!workDir.exists()) {
				Files.createDirectories(workDir.toPath());
			}
		}
		return workDir;
	}
}
