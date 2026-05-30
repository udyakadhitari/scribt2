import { z } from 'zod';
export declare const GENERATIVE_TOOLS: Set<"generate_screen_from_text" | "edit_screens" | "generate_variants">;
export declare const READ_TOOLS: Set<"list_projects" | "get_screen" | "list_screens" | "get_project" | "create_project">;
export type ToolKind = 'generative' | 'read' | 'unknown';
export declare function kindOf(tool: string): ToolKind;
export declare const ProducedScreenSchema: z.ZodObject<{
    project_id: z.ZodString;
    screen_id: z.ZodString;
    name: z.ZodString;
    parent_screen_id: z.ZodNullable<z.ZodString>;
    sibling_screen_ids: z.ZodArray<z.ZodString, "many">;
    effective_prompt: z.ZodString;
    html_blob: z.ZodNullable<z.ZodObject<{
        sha256: z.ZodString;
        size: z.ZodNumber;
        mime: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        sha256: string;
        size: number;
        mime: string;
    }, {
        sha256: string;
        size: number;
        mime: string;
    }>>;
    screenshot_blob: z.ZodNullable<z.ZodObject<{
        sha256: z.ZodString;
        size: z.ZodNumber;
        mime: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        sha256: string;
        size: number;
        mime: string;
    }, {
        sha256: string;
        size: number;
        mime: string;
    }>>;
    theme_blob: z.ZodNullable<z.ZodObject<{
        sha256: z.ZodString;
        size: z.ZodNumber;
        mime: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        sha256: string;
        size: number;
        mime: string;
    }, {
        sha256: string;
        size: number;
        mime: string;
    }>>;
    design_system_blob: z.ZodNullable<z.ZodObject<{
        sha256: z.ZodString;
        size: z.ZodNumber;
        mime: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        sha256: string;
        size: number;
        mime: string;
    }, {
        sha256: string;
        size: number;
        mime: string;
    }>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    project_id: string;
    screen_id: string;
    parent_screen_id: string | null;
    sibling_screen_ids: string[];
    effective_prompt: string;
    html_blob: {
        sha256: string;
        size: number;
        mime: string;
    } | null;
    screenshot_blob: {
        sha256: string;
        size: number;
        mime: string;
    } | null;
    theme_blob: {
        sha256: string;
        size: number;
        mime: string;
    } | null;
    design_system_blob: {
        sha256: string;
        size: number;
        mime: string;
    } | null;
}, {
    name: string;
    project_id: string;
    screen_id: string;
    parent_screen_id: string | null;
    sibling_screen_ids: string[];
    effective_prompt: string;
    html_blob: {
        sha256: string;
        size: number;
        mime: string;
    } | null;
    screenshot_blob: {
        sha256: string;
        size: number;
        mime: string;
    } | null;
    theme_blob: {
        sha256: string;
        size: number;
        mime: string;
    } | null;
    design_system_blob: {
        sha256: string;
        size: number;
        mime: string;
    } | null;
}>;
export type ProducedScreen = z.infer<typeof ProducedScreenSchema>;
export declare const RequestedPayloadSchema: z.ZodObject<{
    tool: z.ZodString;
    project_id: z.ZodOptional<z.ZodString>;
    selected_screen_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    user_prompt: z.ZodOptional<z.ZodString>;
    variant_options: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    device_type: z.ZodOptional<z.ZodString>;
    model_id: z.ZodOptional<z.ZodString>;
    args_blob: z.ZodObject<{
        sha256: z.ZodString;
        size: z.ZodNumber;
        mime: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        sha256: string;
        size: number;
        mime: string;
    }, {
        sha256: string;
        size: number;
        mime: string;
    }>;
}, "strip", z.ZodTypeAny, {
    tool: string;
    args_blob: {
        sha256: string;
        size: number;
        mime: string;
    };
    project_id?: string | undefined;
    selected_screen_ids?: string[] | undefined;
    user_prompt?: string | undefined;
    variant_options?: Record<string, unknown> | undefined;
    device_type?: string | undefined;
    model_id?: string | undefined;
}, {
    tool: string;
    args_blob: {
        sha256: string;
        size: number;
        mime: string;
    };
    project_id?: string | undefined;
    selected_screen_ids?: string[] | undefined;
    user_prompt?: string | undefined;
    variant_options?: Record<string, unknown> | undefined;
    device_type?: string | undefined;
    model_id?: string | undefined;
}>;
export declare const CompletedGenerativePayloadSchema: z.ZodObject<{
    tool: z.ZodString;
    duration_ms: z.ZodNumber;
    kind: z.ZodLiteral<"generative">;
    stitch_session_id: z.ZodOptional<z.ZodString>;
    structured_content_blob: z.ZodObject<{
        sha256: z.ZodString;
        size: z.ZodNumber;
        mime: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        sha256: string;
        size: number;
        mime: string;
    }, {
        sha256: string;
        size: number;
        mime: string;
    }>;
    produced_screens: z.ZodArray<z.ZodObject<{
        project_id: z.ZodString;
        screen_id: z.ZodString;
        name: z.ZodString;
        parent_screen_id: z.ZodNullable<z.ZodString>;
        sibling_screen_ids: z.ZodArray<z.ZodString, "many">;
        effective_prompt: z.ZodString;
        html_blob: z.ZodNullable<z.ZodObject<{
            sha256: z.ZodString;
            size: z.ZodNumber;
            mime: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            sha256: string;
            size: number;
            mime: string;
        }, {
            sha256: string;
            size: number;
            mime: string;
        }>>;
        screenshot_blob: z.ZodNullable<z.ZodObject<{
            sha256: z.ZodString;
            size: z.ZodNumber;
            mime: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            sha256: string;
            size: number;
            mime: string;
        }, {
            sha256: string;
            size: number;
            mime: string;
        }>>;
        theme_blob: z.ZodNullable<z.ZodObject<{
            sha256: z.ZodString;
            size: z.ZodNumber;
            mime: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            sha256: string;
            size: number;
            mime: string;
        }, {
            sha256: string;
            size: number;
            mime: string;
        }>>;
        design_system_blob: z.ZodNullable<z.ZodObject<{
            sha256: z.ZodString;
            size: z.ZodNumber;
            mime: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            sha256: string;
            size: number;
            mime: string;
        }, {
            sha256: string;
            size: number;
            mime: string;
        }>>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        project_id: string;
        screen_id: string;
        parent_screen_id: string | null;
        sibling_screen_ids: string[];
        effective_prompt: string;
        html_blob: {
            sha256: string;
            size: number;
            mime: string;
        } | null;
        screenshot_blob: {
            sha256: string;
            size: number;
            mime: string;
        } | null;
        theme_blob: {
            sha256: string;
            size: number;
            mime: string;
        } | null;
        design_system_blob: {
            sha256: string;
            size: number;
            mime: string;
        } | null;
    }, {
        name: string;
        project_id: string;
        screen_id: string;
        parent_screen_id: string | null;
        sibling_screen_ids: string[];
        effective_prompt: string;
        html_blob: {
            sha256: string;
            size: number;
            mime: string;
        } | null;
        screenshot_blob: {
            sha256: string;
            size: number;
            mime: string;
        } | null;
        theme_blob: {
            sha256: string;
            size: number;
            mime: string;
        } | null;
        design_system_blob: {
            sha256: string;
            size: number;
            mime: string;
        } | null;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    tool: string;
    duration_ms: number;
    kind: "generative";
    structured_content_blob: {
        sha256: string;
        size: number;
        mime: string;
    };
    produced_screens: {
        name: string;
        project_id: string;
        screen_id: string;
        parent_screen_id: string | null;
        sibling_screen_ids: string[];
        effective_prompt: string;
        html_blob: {
            sha256: string;
            size: number;
            mime: string;
        } | null;
        screenshot_blob: {
            sha256: string;
            size: number;
            mime: string;
        } | null;
        theme_blob: {
            sha256: string;
            size: number;
            mime: string;
        } | null;
        design_system_blob: {
            sha256: string;
            size: number;
            mime: string;
        } | null;
    }[];
    stitch_session_id?: string | undefined;
}, {
    tool: string;
    duration_ms: number;
    kind: "generative";
    structured_content_blob: {
        sha256: string;
        size: number;
        mime: string;
    };
    produced_screens: {
        name: string;
        project_id: string;
        screen_id: string;
        parent_screen_id: string | null;
        sibling_screen_ids: string[];
        effective_prompt: string;
        html_blob: {
            sha256: string;
            size: number;
            mime: string;
        } | null;
        screenshot_blob: {
            sha256: string;
            size: number;
            mime: string;
        } | null;
        theme_blob: {
            sha256: string;
            size: number;
            mime: string;
        } | null;
        design_system_blob: {
            sha256: string;
            size: number;
            mime: string;
        } | null;
    }[];
    stitch_session_id?: string | undefined;
}>;
export declare const CompletedReadPayloadSchema: z.ZodObject<{
    tool: z.ZodString;
    duration_ms: z.ZodNumber;
    kind: z.ZodLiteral<"read">;
    project_id: z.ZodOptional<z.ZodString>;
    screen_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    returned_project_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    returned_screen_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    result_blob: z.ZodObject<{
        sha256: z.ZodString;
        size: z.ZodNumber;
        mime: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        sha256: string;
        size: number;
        mime: string;
    }, {
        sha256: string;
        size: number;
        mime: string;
    }>;
}, "strip", z.ZodTypeAny, {
    tool: string;
    duration_ms: number;
    kind: "read";
    result_blob: {
        sha256: string;
        size: number;
        mime: string;
    };
    project_id?: string | undefined;
    screen_ids?: string[] | undefined;
    returned_project_ids?: string[] | undefined;
    returned_screen_ids?: string[] | undefined;
}, {
    tool: string;
    duration_ms: number;
    kind: "read";
    result_blob: {
        sha256: string;
        size: number;
        mime: string;
    };
    project_id?: string | undefined;
    screen_ids?: string[] | undefined;
    returned_project_ids?: string[] | undefined;
    returned_screen_ids?: string[] | undefined;
}>;
export declare const CompletedUnknownPayloadSchema: z.ZodObject<{
    tool: z.ZodString;
    duration_ms: z.ZodNumber;
    kind: z.ZodLiteral<"unknown">;
    project_id: z.ZodOptional<z.ZodString>;
    result_blob: z.ZodObject<{
        sha256: z.ZodString;
        size: z.ZodNumber;
        mime: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        sha256: string;
        size: number;
        mime: string;
    }, {
        sha256: string;
        size: number;
        mime: string;
    }>;
}, "strip", z.ZodTypeAny, {
    tool: string;
    duration_ms: number;
    kind: "unknown";
    result_blob: {
        sha256: string;
        size: number;
        mime: string;
    };
    project_id?: string | undefined;
}, {
    tool: string;
    duration_ms: number;
    kind: "unknown";
    result_blob: {
        sha256: string;
        size: number;
        mime: string;
    };
    project_id?: string | undefined;
}>;
export declare const CompletedPayloadSchema: z.ZodDiscriminatedUnion<"kind", [z.ZodObject<{
    tool: z.ZodString;
    duration_ms: z.ZodNumber;
    kind: z.ZodLiteral<"generative">;
    stitch_session_id: z.ZodOptional<z.ZodString>;
    structured_content_blob: z.ZodObject<{
        sha256: z.ZodString;
        size: z.ZodNumber;
        mime: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        sha256: string;
        size: number;
        mime: string;
    }, {
        sha256: string;
        size: number;
        mime: string;
    }>;
    produced_screens: z.ZodArray<z.ZodObject<{
        project_id: z.ZodString;
        screen_id: z.ZodString;
        name: z.ZodString;
        parent_screen_id: z.ZodNullable<z.ZodString>;
        sibling_screen_ids: z.ZodArray<z.ZodString, "many">;
        effective_prompt: z.ZodString;
        html_blob: z.ZodNullable<z.ZodObject<{
            sha256: z.ZodString;
            size: z.ZodNumber;
            mime: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            sha256: string;
            size: number;
            mime: string;
        }, {
            sha256: string;
            size: number;
            mime: string;
        }>>;
        screenshot_blob: z.ZodNullable<z.ZodObject<{
            sha256: z.ZodString;
            size: z.ZodNumber;
            mime: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            sha256: string;
            size: number;
            mime: string;
        }, {
            sha256: string;
            size: number;
            mime: string;
        }>>;
        theme_blob: z.ZodNullable<z.ZodObject<{
            sha256: z.ZodString;
            size: z.ZodNumber;
            mime: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            sha256: string;
            size: number;
            mime: string;
        }, {
            sha256: string;
            size: number;
            mime: string;
        }>>;
        design_system_blob: z.ZodNullable<z.ZodObject<{
            sha256: z.ZodString;
            size: z.ZodNumber;
            mime: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            sha256: string;
            size: number;
            mime: string;
        }, {
            sha256: string;
            size: number;
            mime: string;
        }>>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        project_id: string;
        screen_id: string;
        parent_screen_id: string | null;
        sibling_screen_ids: string[];
        effective_prompt: string;
        html_blob: {
            sha256: string;
            size: number;
            mime: string;
        } | null;
        screenshot_blob: {
            sha256: string;
            size: number;
            mime: string;
        } | null;
        theme_blob: {
            sha256: string;
            size: number;
            mime: string;
        } | null;
        design_system_blob: {
            sha256: string;
            size: number;
            mime: string;
        } | null;
    }, {
        name: string;
        project_id: string;
        screen_id: string;
        parent_screen_id: string | null;
        sibling_screen_ids: string[];
        effective_prompt: string;
        html_blob: {
            sha256: string;
            size: number;
            mime: string;
        } | null;
        screenshot_blob: {
            sha256: string;
            size: number;
            mime: string;
        } | null;
        theme_blob: {
            sha256: string;
            size: number;
            mime: string;
        } | null;
        design_system_blob: {
            sha256: string;
            size: number;
            mime: string;
        } | null;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    tool: string;
    duration_ms: number;
    kind: "generative";
    structured_content_blob: {
        sha256: string;
        size: number;
        mime: string;
    };
    produced_screens: {
        name: string;
        project_id: string;
        screen_id: string;
        parent_screen_id: string | null;
        sibling_screen_ids: string[];
        effective_prompt: string;
        html_blob: {
            sha256: string;
            size: number;
            mime: string;
        } | null;
        screenshot_blob: {
            sha256: string;
            size: number;
            mime: string;
        } | null;
        theme_blob: {
            sha256: string;
            size: number;
            mime: string;
        } | null;
        design_system_blob: {
            sha256: string;
            size: number;
            mime: string;
        } | null;
    }[];
    stitch_session_id?: string | undefined;
}, {
    tool: string;
    duration_ms: number;
    kind: "generative";
    structured_content_blob: {
        sha256: string;
        size: number;
        mime: string;
    };
    produced_screens: {
        name: string;
        project_id: string;
        screen_id: string;
        parent_screen_id: string | null;
        sibling_screen_ids: string[];
        effective_prompt: string;
        html_blob: {
            sha256: string;
            size: number;
            mime: string;
        } | null;
        screenshot_blob: {
            sha256: string;
            size: number;
            mime: string;
        } | null;
        theme_blob: {
            sha256: string;
            size: number;
            mime: string;
        } | null;
        design_system_blob: {
            sha256: string;
            size: number;
            mime: string;
        } | null;
    }[];
    stitch_session_id?: string | undefined;
}>, z.ZodObject<{
    tool: z.ZodString;
    duration_ms: z.ZodNumber;
    kind: z.ZodLiteral<"read">;
    project_id: z.ZodOptional<z.ZodString>;
    screen_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    returned_project_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    returned_screen_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    result_blob: z.ZodObject<{
        sha256: z.ZodString;
        size: z.ZodNumber;
        mime: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        sha256: string;
        size: number;
        mime: string;
    }, {
        sha256: string;
        size: number;
        mime: string;
    }>;
}, "strip", z.ZodTypeAny, {
    tool: string;
    duration_ms: number;
    kind: "read";
    result_blob: {
        sha256: string;
        size: number;
        mime: string;
    };
    project_id?: string | undefined;
    screen_ids?: string[] | undefined;
    returned_project_ids?: string[] | undefined;
    returned_screen_ids?: string[] | undefined;
}, {
    tool: string;
    duration_ms: number;
    kind: "read";
    result_blob: {
        sha256: string;
        size: number;
        mime: string;
    };
    project_id?: string | undefined;
    screen_ids?: string[] | undefined;
    returned_project_ids?: string[] | undefined;
    returned_screen_ids?: string[] | undefined;
}>, z.ZodObject<{
    tool: z.ZodString;
    duration_ms: z.ZodNumber;
    kind: z.ZodLiteral<"unknown">;
    project_id: z.ZodOptional<z.ZodString>;
    result_blob: z.ZodObject<{
        sha256: z.ZodString;
        size: z.ZodNumber;
        mime: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        sha256: string;
        size: number;
        mime: string;
    }, {
        sha256: string;
        size: number;
        mime: string;
    }>;
}, "strip", z.ZodTypeAny, {
    tool: string;
    duration_ms: number;
    kind: "unknown";
    result_blob: {
        sha256: string;
        size: number;
        mime: string;
    };
    project_id?: string | undefined;
}, {
    tool: string;
    duration_ms: number;
    kind: "unknown";
    result_blob: {
        sha256: string;
        size: number;
        mime: string;
    };
    project_id?: string | undefined;
}>]>;
export declare const FailedPayloadSchema: z.ZodObject<{
    tool: z.ZodString;
    duration_ms: z.ZodNumber;
    is_error: z.ZodUnion<[z.ZodLiteral<true>, z.ZodLiteral<"empty">]>;
    error_text: z.ZodOptional<z.ZodString>;
    raw_blob: z.ZodOptional<z.ZodObject<{
        sha256: z.ZodString;
        size: z.ZodNumber;
        mime: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        sha256: string;
        size: number;
        mime: string;
    }, {
        sha256: string;
        size: number;
        mime: string;
    }>>;
}, "strip", z.ZodTypeAny, {
    tool: string;
    duration_ms: number;
    is_error: true | "empty";
    error_text?: string | undefined;
    raw_blob?: {
        sha256: string;
        size: number;
        mime: string;
    } | undefined;
}, {
    tool: string;
    duration_ms: number;
    is_error: true | "empty";
    error_text?: string | undefined;
    raw_blob?: {
        sha256: string;
        size: number;
        mime: string;
    } | undefined;
}>;
export declare const EventSchema: z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
    type: z.ZodLiteral<"call.requested">;
    payload: z.ZodObject<{
        tool: z.ZodString;
        project_id: z.ZodOptional<z.ZodString>;
        selected_screen_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        user_prompt: z.ZodOptional<z.ZodString>;
        variant_options: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        device_type: z.ZodOptional<z.ZodString>;
        model_id: z.ZodOptional<z.ZodString>;
        args_blob: z.ZodObject<{
            sha256: z.ZodString;
            size: z.ZodNumber;
            mime: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            sha256: string;
            size: number;
            mime: string;
        }, {
            sha256: string;
            size: number;
            mime: string;
        }>;
    }, "strip", z.ZodTypeAny, {
        tool: string;
        args_blob: {
            sha256: string;
            size: number;
            mime: string;
        };
        project_id?: string | undefined;
        selected_screen_ids?: string[] | undefined;
        user_prompt?: string | undefined;
        variant_options?: Record<string, unknown> | undefined;
        device_type?: string | undefined;
        model_id?: string | undefined;
    }, {
        tool: string;
        args_blob: {
            sha256: string;
            size: number;
            mime: string;
        };
        project_id?: string | undefined;
        selected_screen_ids?: string[] | undefined;
        user_prompt?: string | undefined;
        variant_options?: Record<string, unknown> | undefined;
        device_type?: string | undefined;
        model_id?: string | undefined;
    }>;
    id: z.ZodString;
    time: z.ZodString;
    trace_id: z.ZodString;
    schema_version: z.ZodLiteral<1>;
}, "strip", z.ZodTypeAny, {
    type: "call.requested";
    id: string;
    time: string;
    trace_id: string;
    schema_version: 1;
    payload: {
        tool: string;
        args_blob: {
            sha256: string;
            size: number;
            mime: string;
        };
        project_id?: string | undefined;
        selected_screen_ids?: string[] | undefined;
        user_prompt?: string | undefined;
        variant_options?: Record<string, unknown> | undefined;
        device_type?: string | undefined;
        model_id?: string | undefined;
    };
}, {
    type: "call.requested";
    id: string;
    time: string;
    trace_id: string;
    schema_version: 1;
    payload: {
        tool: string;
        args_blob: {
            sha256: string;
            size: number;
            mime: string;
        };
        project_id?: string | undefined;
        selected_screen_ids?: string[] | undefined;
        user_prompt?: string | undefined;
        variant_options?: Record<string, unknown> | undefined;
        device_type?: string | undefined;
        model_id?: string | undefined;
    };
}>, z.ZodObject<{
    type: z.ZodLiteral<"call.completed">;
    payload: z.ZodDiscriminatedUnion<"kind", [z.ZodObject<{
        tool: z.ZodString;
        duration_ms: z.ZodNumber;
        kind: z.ZodLiteral<"generative">;
        stitch_session_id: z.ZodOptional<z.ZodString>;
        structured_content_blob: z.ZodObject<{
            sha256: z.ZodString;
            size: z.ZodNumber;
            mime: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            sha256: string;
            size: number;
            mime: string;
        }, {
            sha256: string;
            size: number;
            mime: string;
        }>;
        produced_screens: z.ZodArray<z.ZodObject<{
            project_id: z.ZodString;
            screen_id: z.ZodString;
            name: z.ZodString;
            parent_screen_id: z.ZodNullable<z.ZodString>;
            sibling_screen_ids: z.ZodArray<z.ZodString, "many">;
            effective_prompt: z.ZodString;
            html_blob: z.ZodNullable<z.ZodObject<{
                sha256: z.ZodString;
                size: z.ZodNumber;
                mime: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                sha256: string;
                size: number;
                mime: string;
            }, {
                sha256: string;
                size: number;
                mime: string;
            }>>;
            screenshot_blob: z.ZodNullable<z.ZodObject<{
                sha256: z.ZodString;
                size: z.ZodNumber;
                mime: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                sha256: string;
                size: number;
                mime: string;
            }, {
                sha256: string;
                size: number;
                mime: string;
            }>>;
            theme_blob: z.ZodNullable<z.ZodObject<{
                sha256: z.ZodString;
                size: z.ZodNumber;
                mime: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                sha256: string;
                size: number;
                mime: string;
            }, {
                sha256: string;
                size: number;
                mime: string;
            }>>;
            design_system_blob: z.ZodNullable<z.ZodObject<{
                sha256: z.ZodString;
                size: z.ZodNumber;
                mime: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                sha256: string;
                size: number;
                mime: string;
            }, {
                sha256: string;
                size: number;
                mime: string;
            }>>;
        }, "strip", z.ZodTypeAny, {
            name: string;
            project_id: string;
            screen_id: string;
            parent_screen_id: string | null;
            sibling_screen_ids: string[];
            effective_prompt: string;
            html_blob: {
                sha256: string;
                size: number;
                mime: string;
            } | null;
            screenshot_blob: {
                sha256: string;
                size: number;
                mime: string;
            } | null;
            theme_blob: {
                sha256: string;
                size: number;
                mime: string;
            } | null;
            design_system_blob: {
                sha256: string;
                size: number;
                mime: string;
            } | null;
        }, {
            name: string;
            project_id: string;
            screen_id: string;
            parent_screen_id: string | null;
            sibling_screen_ids: string[];
            effective_prompt: string;
            html_blob: {
                sha256: string;
                size: number;
                mime: string;
            } | null;
            screenshot_blob: {
                sha256: string;
                size: number;
                mime: string;
            } | null;
            theme_blob: {
                sha256: string;
                size: number;
                mime: string;
            } | null;
            design_system_blob: {
                sha256: string;
                size: number;
                mime: string;
            } | null;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        tool: string;
        duration_ms: number;
        kind: "generative";
        structured_content_blob: {
            sha256: string;
            size: number;
            mime: string;
        };
        produced_screens: {
            name: string;
            project_id: string;
            screen_id: string;
            parent_screen_id: string | null;
            sibling_screen_ids: string[];
            effective_prompt: string;
            html_blob: {
                sha256: string;
                size: number;
                mime: string;
            } | null;
            screenshot_blob: {
                sha256: string;
                size: number;
                mime: string;
            } | null;
            theme_blob: {
                sha256: string;
                size: number;
                mime: string;
            } | null;
            design_system_blob: {
                sha256: string;
                size: number;
                mime: string;
            } | null;
        }[];
        stitch_session_id?: string | undefined;
    }, {
        tool: string;
        duration_ms: number;
        kind: "generative";
        structured_content_blob: {
            sha256: string;
            size: number;
            mime: string;
        };
        produced_screens: {
            name: string;
            project_id: string;
            screen_id: string;
            parent_screen_id: string | null;
            sibling_screen_ids: string[];
            effective_prompt: string;
            html_blob: {
                sha256: string;
                size: number;
                mime: string;
            } | null;
            screenshot_blob: {
                sha256: string;
                size: number;
                mime: string;
            } | null;
            theme_blob: {
                sha256: string;
                size: number;
                mime: string;
            } | null;
            design_system_blob: {
                sha256: string;
                size: number;
                mime: string;
            } | null;
        }[];
        stitch_session_id?: string | undefined;
    }>, z.ZodObject<{
        tool: z.ZodString;
        duration_ms: z.ZodNumber;
        kind: z.ZodLiteral<"read">;
        project_id: z.ZodOptional<z.ZodString>;
        screen_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        returned_project_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        returned_screen_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        result_blob: z.ZodObject<{
            sha256: z.ZodString;
            size: z.ZodNumber;
            mime: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            sha256: string;
            size: number;
            mime: string;
        }, {
            sha256: string;
            size: number;
            mime: string;
        }>;
    }, "strip", z.ZodTypeAny, {
        tool: string;
        duration_ms: number;
        kind: "read";
        result_blob: {
            sha256: string;
            size: number;
            mime: string;
        };
        project_id?: string | undefined;
        screen_ids?: string[] | undefined;
        returned_project_ids?: string[] | undefined;
        returned_screen_ids?: string[] | undefined;
    }, {
        tool: string;
        duration_ms: number;
        kind: "read";
        result_blob: {
            sha256: string;
            size: number;
            mime: string;
        };
        project_id?: string | undefined;
        screen_ids?: string[] | undefined;
        returned_project_ids?: string[] | undefined;
        returned_screen_ids?: string[] | undefined;
    }>, z.ZodObject<{
        tool: z.ZodString;
        duration_ms: z.ZodNumber;
        kind: z.ZodLiteral<"unknown">;
        project_id: z.ZodOptional<z.ZodString>;
        result_blob: z.ZodObject<{
            sha256: z.ZodString;
            size: z.ZodNumber;
            mime: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            sha256: string;
            size: number;
            mime: string;
        }, {
            sha256: string;
            size: number;
            mime: string;
        }>;
    }, "strip", z.ZodTypeAny, {
        tool: string;
        duration_ms: number;
        kind: "unknown";
        result_blob: {
            sha256: string;
            size: number;
            mime: string;
        };
        project_id?: string | undefined;
    }, {
        tool: string;
        duration_ms: number;
        kind: "unknown";
        result_blob: {
            sha256: string;
            size: number;
            mime: string;
        };
        project_id?: string | undefined;
    }>]>;
    id: z.ZodString;
    time: z.ZodString;
    trace_id: z.ZodString;
    schema_version: z.ZodLiteral<1>;
}, "strip", z.ZodTypeAny, {
    type: "call.completed";
    id: string;
    time: string;
    trace_id: string;
    schema_version: 1;
    payload: {
        tool: string;
        duration_ms: number;
        kind: "generative";
        structured_content_blob: {
            sha256: string;
            size: number;
            mime: string;
        };
        produced_screens: {
            name: string;
            project_id: string;
            screen_id: string;
            parent_screen_id: string | null;
            sibling_screen_ids: string[];
            effective_prompt: string;
            html_blob: {
                sha256: string;
                size: number;
                mime: string;
            } | null;
            screenshot_blob: {
                sha256: string;
                size: number;
                mime: string;
            } | null;
            theme_blob: {
                sha256: string;
                size: number;
                mime: string;
            } | null;
            design_system_blob: {
                sha256: string;
                size: number;
                mime: string;
            } | null;
        }[];
        stitch_session_id?: string | undefined;
    } | {
        tool: string;
        duration_ms: number;
        kind: "read";
        result_blob: {
            sha256: string;
            size: number;
            mime: string;
        };
        project_id?: string | undefined;
        screen_ids?: string[] | undefined;
        returned_project_ids?: string[] | undefined;
        returned_screen_ids?: string[] | undefined;
    } | {
        tool: string;
        duration_ms: number;
        kind: "unknown";
        result_blob: {
            sha256: string;
            size: number;
            mime: string;
        };
        project_id?: string | undefined;
    };
}, {
    type: "call.completed";
    id: string;
    time: string;
    trace_id: string;
    schema_version: 1;
    payload: {
        tool: string;
        duration_ms: number;
        kind: "generative";
        structured_content_blob: {
            sha256: string;
            size: number;
            mime: string;
        };
        produced_screens: {
            name: string;
            project_id: string;
            screen_id: string;
            parent_screen_id: string | null;
            sibling_screen_ids: string[];
            effective_prompt: string;
            html_blob: {
                sha256: string;
                size: number;
                mime: string;
            } | null;
            screenshot_blob: {
                sha256: string;
                size: number;
                mime: string;
            } | null;
            theme_blob: {
                sha256: string;
                size: number;
                mime: string;
            } | null;
            design_system_blob: {
                sha256: string;
                size: number;
                mime: string;
            } | null;
        }[];
        stitch_session_id?: string | undefined;
    } | {
        tool: string;
        duration_ms: number;
        kind: "read";
        result_blob: {
            sha256: string;
            size: number;
            mime: string;
        };
        project_id?: string | undefined;
        screen_ids?: string[] | undefined;
        returned_project_ids?: string[] | undefined;
        returned_screen_ids?: string[] | undefined;
    } | {
        tool: string;
        duration_ms: number;
        kind: "unknown";
        result_blob: {
            sha256: string;
            size: number;
            mime: string;
        };
        project_id?: string | undefined;
    };
}>, z.ZodObject<{
    type: z.ZodLiteral<"call.failed">;
    payload: z.ZodObject<{
        tool: z.ZodString;
        duration_ms: z.ZodNumber;
        is_error: z.ZodUnion<[z.ZodLiteral<true>, z.ZodLiteral<"empty">]>;
        error_text: z.ZodOptional<z.ZodString>;
        raw_blob: z.ZodOptional<z.ZodObject<{
            sha256: z.ZodString;
            size: z.ZodNumber;
            mime: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            sha256: string;
            size: number;
            mime: string;
        }, {
            sha256: string;
            size: number;
            mime: string;
        }>>;
    }, "strip", z.ZodTypeAny, {
        tool: string;
        duration_ms: number;
        is_error: true | "empty";
        error_text?: string | undefined;
        raw_blob?: {
            sha256: string;
            size: number;
            mime: string;
        } | undefined;
    }, {
        tool: string;
        duration_ms: number;
        is_error: true | "empty";
        error_text?: string | undefined;
        raw_blob?: {
            sha256: string;
            size: number;
            mime: string;
        } | undefined;
    }>;
    id: z.ZodString;
    time: z.ZodString;
    trace_id: z.ZodString;
    schema_version: z.ZodLiteral<1>;
}, "strip", z.ZodTypeAny, {
    type: "call.failed";
    id: string;
    time: string;
    trace_id: string;
    schema_version: 1;
    payload: {
        tool: string;
        duration_ms: number;
        is_error: true | "empty";
        error_text?: string | undefined;
        raw_blob?: {
            sha256: string;
            size: number;
            mime: string;
        } | undefined;
    };
}, {
    type: "call.failed";
    id: string;
    time: string;
    trace_id: string;
    schema_version: 1;
    payload: {
        tool: string;
        duration_ms: number;
        is_error: true | "empty";
        error_text?: string | undefined;
        raw_blob?: {
            sha256: string;
            size: number;
            mime: string;
        } | undefined;
    };
}>]>;
export type Event = z.infer<typeof EventSchema>;
export declare const CaptureInputSchema: z.ZodObject<{
    tool: z.ZodString;
    args: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    result: z.ZodUnknown;
    duration_ms: z.ZodNumber;
    started_at: z.ZodString;
    finished_at: z.ZodString;
}, "strip", z.ZodTypeAny, {
    args: Record<string, unknown>;
    tool: string;
    duration_ms: number;
    started_at: string;
    finished_at: string;
    result?: unknown;
}, {
    args: Record<string, unknown>;
    tool: string;
    duration_ms: number;
    started_at: string;
    finished_at: string;
    result?: unknown;
}>;
export type CaptureInput = z.infer<typeof CaptureInputSchema>;
export declare const CaptureErrorCodeSchema: z.ZodEnum<["CAPTURE_UNKNOWN_TOOL", "CAPTURE_APPEND_FAILED", "CAPTURE_BLOB_FATAL", "CAPTURE_INVALID_INPUT"]>;
export declare const CaptureResultSchema: z.ZodUnion<[z.ZodObject<{
    success: z.ZodLiteral<true>;
    data: z.ZodObject<{
        trace_id: z.ZodString;
        produced_screen_ids: z.ZodArray<z.ZodString, "many">;
        warnings: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        trace_id: string;
        produced_screen_ids: string[];
        warnings: string[];
    }, {
        trace_id: string;
        produced_screen_ids: string[];
        warnings: string[];
    }>;
}, "strip", z.ZodTypeAny, {
    success: true;
    data: {
        trace_id: string;
        produced_screen_ids: string[];
        warnings: string[];
    };
}, {
    success: true;
    data: {
        trace_id: string;
        produced_screen_ids: string[];
        warnings: string[];
    };
}>, z.ZodObject<{
    success: z.ZodLiteral<false>;
    error: z.ZodObject<{
        code: z.ZodEnum<["CAPTURE_UNKNOWN_TOOL", "CAPTURE_APPEND_FAILED", "CAPTURE_BLOB_FATAL", "CAPTURE_INVALID_INPUT"]>;
        message: z.ZodString;
        recoverable: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        code: "CAPTURE_UNKNOWN_TOOL" | "CAPTURE_APPEND_FAILED" | "CAPTURE_BLOB_FATAL" | "CAPTURE_INVALID_INPUT";
        message: string;
        recoverable: boolean;
    }, {
        code: "CAPTURE_UNKNOWN_TOOL" | "CAPTURE_APPEND_FAILED" | "CAPTURE_BLOB_FATAL" | "CAPTURE_INVALID_INPUT";
        message: string;
        recoverable: boolean;
    }>;
}, "strip", z.ZodTypeAny, {
    success: false;
    error: {
        code: "CAPTURE_UNKNOWN_TOOL" | "CAPTURE_APPEND_FAILED" | "CAPTURE_BLOB_FATAL" | "CAPTURE_INVALID_INPUT";
        message: string;
        recoverable: boolean;
    };
}, {
    success: false;
    error: {
        code: "CAPTURE_UNKNOWN_TOOL" | "CAPTURE_APPEND_FAILED" | "CAPTURE_BLOB_FATAL" | "CAPTURE_INVALID_INPUT";
        message: string;
        recoverable: boolean;
    };
}>]>;
export type CaptureResult = z.infer<typeof CaptureResultSchema>;
import type { BlobStoreSpec } from '../blob-store/spec.js';
import type { AppendResult } from '../append.js';
export type AppendFn = (event: Event) => Promise<AppendResult>;
export interface CaptureSpec {
    capture(input: CaptureInput): Promise<CaptureResult>;
}
export interface CaptureDeps {
    blobs: BlobStoreSpec;
    append: AppendFn;
    now?: () => Date;
    newId?: () => string;
}
