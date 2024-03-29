/*******************************************************************************
 * Copyright (c) 2018 - 2024 Maxprograms.
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

import java.io.IOException;
import java.lang.System.Logger;
import java.lang.System.Logger.Level;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URL;
import java.util.Locale;

import javax.xml.parsers.ParserConfigurationException;

import org.xml.sax.SAXException;

import com.maxprograms.languages.LanguageUtils;

public class CheckURL {

	private static Logger logger = System.getLogger(CheckURL.class.getName());

	public static void main(String[] args) {
		if (args.length < 1) {
			return;
		}
		for (int i = 0; i < args.length; i++) {
			String arg = args[i];
			if (arg.equals("-lang") && (i + 1) < args.length) {
				String lang = args[i + 1];
				try {
					if (LanguageUtils.getLanguage(lang) != null) {
						Locale locale = Locale.forLanguageTag(lang);
						Locale.setDefault(locale);
					}
				} catch (IOException | SAXException | ParserConfigurationException e) {
					logger.log(Level.WARNING, e);
				}
			}
		}
		checkURL(args[0]);
	}

	private static void checkURL(String string) {
		boolean waiting = true;
		int count = 0;
		while (waiting && count < 40) {
			try {
				connect(string);
				waiting = false;
			} catch (IOException | URISyntaxException e) {
				try {
					Thread.sleep(500);
					count++;
				} catch (InterruptedException e1) {
					logger.log(Level.ERROR, e1.getMessage(), e1);
					Thread.currentThread().interrupt();
				}
			}
		}
		if (count < 40) {
			logger.log(Level.INFO, Messages.getString("CheckURL.0"));
		} else {
			System.exit(1);
		}
	}

	private static void connect(String string) throws IOException, URISyntaxException {
		URL url = new URI(string).toURL();
		HttpURLConnection connection = (HttpURLConnection) url.openConnection();
		connection.setConnectTimeout(1000);
		connection.connect();
	}

}
