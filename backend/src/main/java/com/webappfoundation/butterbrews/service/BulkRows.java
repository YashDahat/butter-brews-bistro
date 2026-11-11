package com.webappfoundation.butterbrews.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;

/** Small typed readers over SpreadsheetParser rows (headers are trimmed + lower-cased). */
final class BulkRows {
    private BulkRows() {}

    static String str(Map<String, String> row, String key) {
        String v = row.get(key.toLowerCase());
        return v == null || v.isBlank() ? null : v.trim();
    }

    static Integer integer(Map<String, String> row, String key) {
        String v = str(row, key);
        if (v == null) return null;
        try {
            return (int) Double.parseDouble(v);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException(key + " must be a whole number");
        }
    }

    static BigDecimal decimal(Map<String, String> row, String key) {
        String v = str(row, key);
        if (v == null) return null;
        try {
            return new BigDecimal(v);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException(key + " must be a number");
        }
    }

    static boolean bool(Map<String, String> row, String key, boolean dflt) {
        String v = str(row, key);
        if (v == null) return dflt;
        return v.equalsIgnoreCase("true") || v.equalsIgnoreCase("yes") || v.equals("1") || v.equalsIgnoreCase("y");
    }

    static LocalDate date(Map<String, String> row, String key) {
        String v = str(row, key);
        if (v == null) return null;
        try {
            return LocalDate.parse(v);
        } catch (Exception e) {
            throw new IllegalArgumentException(key + " must be a date like 2026-11-20");
        }
    }

    static <E extends Enum<E>> E enumOf(Class<E> type, Map<String, String> row, String key, E dflt) {
        String v = str(row, key);
        if (v == null) return dflt;
        try {
            return Enum.valueOf(type, v.trim().toUpperCase().replace(' ', '_').replace('-', '_'));
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException(key + " has an unknown value: " + v);
        }
    }
}
