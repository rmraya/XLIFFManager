/*******************************************************************************
 * Copyright (c) 2023 Maxprograms.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 1.0 which accompanies this distribution,
 * and is available at https://www.eclipse.org/org/documents/epl-v10.html
 *
 * Contributors: Maxprograms - initial API and implementation
 *******************************************************************************/
module xliffmanager {
	
	exports com.maxprograms.server;
	
	requires openxliff;
	requires dtd;
	requires jsoup;
	requires mapdb;
	requires java.base;
	requires java.logging;
	requires java.net.http;
	requires transitive xmljava;
	requires transitive json;
	requires transitive jdk.httpserver;
	requires transitive java.xml;
}
