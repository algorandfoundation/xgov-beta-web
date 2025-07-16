export interface Topic {
    post_stream: PostStream;
    timeline_lookup: Array<number[]>;
    tags: string[];
    tags_descriptions: Object;
    id: number;
    title: string;
    fancy_title: string;
    posts_count: number;
    created_at: Date;
    views: number;
    reply_count: number;
    like_count: number;
    last_posted_at: Date;
    visible: boolean;
    closed: boolean;
    archived: boolean;
    has_summary: boolean;
    archetype: string;
    slug: string;
    category_id: number;
    word_count: number;
    deleted_at: null;
    user_id: number;
    featured_link: null;
    pinned_globally: boolean;
    pinned_at: null;
    pinned_until: null;
    image_url: null;
    slow_mode_seconds: number;
    draft: null;
    draft_key: string;
    draft_sequence: null;
    unpinned: null;
    pinned: boolean;
    current_post_number: number;
    highest_post_number: number;
    deleted_by: null;
    actions_summary: TopicActionsSummary[];
    chunk_size: number;
    bookmarked: boolean;
    topic_timer: null;
    message_bus_last_id: number;
    participant_count: number;
    show_read_indicator: boolean;
    thumbnails: null;
    slow_mode_enabled_until: null;
    related_topics: null;
    summarizable: boolean;
    can_vote: boolean;
    vote_count: number;
    user_voted: boolean;
    discourse_zendesk_plugin_zendesk_id: null;
    discourse_zendesk_plugin_zendesk_url: string;
    details: Details;
    bookmarks: any[];
}

export interface TopicActionsSummary {
    id: number;
    count: number;
    hidden: boolean;
    can_act: boolean;
}

export interface Details {
    can_edit: boolean;
    notification_level: number;
    participants: Participant[];
    created_by: CreatedBy;
    last_poster: CreatedBy;
    links: Link[];
}

export interface CreatedBy {
    id: number;
    username: string;
    name: string;
    avatar_template: string;
}

export interface Link {
    url: string;
    title: string;
    internal: boolean;
    attachment: boolean;
    reflection: boolean;
    clicks: number;
    user_id: number;
    domain: string;
    root_domain: string;
}

export interface Participant {
    id: number;
    username: string;
    name: string;
    avatar_template: string;
    post_count: number;
    primary_group_name: null;
    flair_name: null | string;
    flair_url: null | string;
    flair_color: null | string;
    flair_bg_color: null | string;
    flair_group_id: number | null;
    admin?: boolean;
    moderator?: boolean;
    trust_level: number;
}

export interface PostStream {
    posts: Post[];
    stream: number[];
}

export interface Post {
    id: number;
    name: string;
    username: string;
    avatar_template: string;
    created_at: Date;
    cooked: string;
    post_number: number;
    post_type: number;
    posts_count: number;
    updated_at: Date;
    reply_count: number;
    reply_to_post_number: number | null;
    quote_count: number;
    incoming_link_count: number;
    reads: number;
    readers_count: number;
    score: number;
    yours: boolean;
    topic_id: number;
    topic_slug: string;
    display_username: string;
    primary_group_name: null;
    flair_name: null | string;
    flair_url: null | string;
    flair_bg_color: null | string;
    flair_color: null | string;
    flair_group_id: number | null;
    badges_granted: any[];
    version: number;
    can_edit: boolean;
    can_delete: boolean;
    can_recover: boolean;
    can_see_hidden_post: boolean;
    can_wiki: boolean;
    link_counts?: LinkCount[];
    read: boolean;
    user_title: null | string;
    title_is_group?: boolean;
    bookmarked: boolean;
    actions_summary: PostActionsSummary[];
    moderator: boolean;
    admin: boolean;
    staff: boolean;
    user_id: number;
    hidden: boolean;
    trust_level: number;
    deleted_at: null;
    user_deleted: boolean;
    edit_reason: null;
    can_view_edit_history: boolean;
    wiki: boolean;
    post_url: string;
    can_accept_answer: boolean;
    can_unaccept_answer: boolean;
    accepted_answer: boolean;
    topic_accepted_answer: null;
    can_vote?: boolean;
    reply_to_user?: CreatedBy;
}

export interface PostActionsSummary {
    id: number;
    count: number;
}

export interface LinkCount {
    url: string;
    internal: boolean;
    reflection: boolean;
    title: string;
    clicks: number;
}