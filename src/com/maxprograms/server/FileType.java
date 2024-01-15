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

public class FileType implements Comparable<FileType> {
	String code;
	String description;

	FileType(String code, String description) {
		this.code = code;
		this.description = description;
	}

	public String getCode() {
		return code;
	}

	public String getDescription() {
		return description;
	}

	@Override
	public int compareTo(FileType o) {
		return description.compareTo(o.description);
	}

	@Override
	public boolean equals(Object obj) {
		if (obj instanceof FileType ft) {
			return code.equals(ft.code) && description.equals(ft.description);
		}
		return false;
	}

	@Override
	public int hashCode() {
		return code.hashCode() + description.hashCode();
	}
}