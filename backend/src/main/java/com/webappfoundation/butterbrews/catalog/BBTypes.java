package com.webappfoundation.butterbrews.catalog;

import java.time.ZoneId;

/** Item types, workflow codes and fixed keys owned by the Butter Brews domain. */
public final class BBTypes {
    private BBTypes() {}

    public static final String SEATING = "BB_SEATING";

    public static final String WF_KITCHEN = "bb-kitchen";
    public static final String WF_BAKEHOUSE = "bb-bakehouse";
    public static final String WF_TABLE = "bb-table";

    public static final String CATEGORY_BAKEHOUSE = "Bakehouse";

    public static final String BRANCH_SLUG = "butter-brews-model-colony";
    public static final ZoneId ZONE = ZoneId.of("Asia/Kolkata");
}
