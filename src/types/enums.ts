export enum RoleEnum {
    USER = "user",
    ADMIN = "admin",
}

export enum UserStatusEnum {
    ACTIVE = "active",
    INACTIVE = "inactive",
}

export enum NotificationTypeEnum {
    NEW_FOLLOWER = "new_follower",
    PIN_LIKED = "pin_liked",
    PIN_SAVED = "pin_saved",
    PIN_COMMENTED = "pin_commented",
    COMMENT_REPLIED = "comment_replied",
    COMMENT_LIKED = "comment_liked",
    BOARD_CREATED = "board_created",
    PIN_CREATED = "pin_created",
    BOARD_INVITE = "board_invite",
}

export enum InteractionTypeEnum {
    LIKE = "like",
    CLICK = "click",
    SAVE = "save",
    SHARE = "share",
}