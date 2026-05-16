# Database Schemes

## Class Diagram

```mermaid
classDiagram
  class User {
    +String id
    +String email
    +String login
    +UserRole role
    +String name
    +Boolean emailVerified
    +String image
    +DateTime createdAt
    +DateTime updatedAt
  }

  class Profile {
    +String firstname
    +String lastname
    +String pseudo
    +DateTime birthdate
    +String avatarUri
    +Float level
    +String bio
  }

  class ProfileSocial {
    +String platform
    +String label
    +String url
  }

  class Session {
    +String token
    +DateTime expiresAt
    +String ipAddress
    +String userAgent
  }

  class Account {
    +String accountId
    +String providerId
    +String accessToken
    +String refreshToken
    +String idToken
    +String scope
    +String password
  }

  class Verification {
    +String identifier
    +String value
    +DateTime expiresAt
  }

  class Interest {
    +String name
    +String color
    +String imageUri
  }

  class UserInterest {
    +InterestLevel interestLvl
  }

  class Channel {
    +Int interestId
  }

  class UserChannel {
    +DateTime joinedAt
    +Boolean isFavorite
  }

  class Post {
    +DateTime createdAt
    +String content
    +PostType type
  }

  class Reaction {
    +String emoji
  }

  class FileAsset {
    +String storageKey
    +String originalName
    +String mimeType
    +Int sizeBytes
    +FileCategory category
    +AttachmentType attachmentType
    +FileStatus status
  }

  class Attachment {
    +AttachmentType type
  }

  class FriendRequest {
    +String pairKey
    +FriendRequestStatus status
    +DateTime CreatedAt
    +DateTime UpdatedAt
  }

  class Chat {
    +String name
    +ChatType type
  }

  class Message {
    +DateTime createdAt
    +String content
    +MessageType type
  }

  class Notification {
    +NotifType type
  }

  class DataRequest {
    +DataRequestType type
    +DataRequestStatus status
    +String confirmationTokenHash
    +DateTime confirmationExpiresAt
    +String exportStorageKey
    +String exportMimeType
    +Int exportSizeBytes
    +DateTime requestedAt
    +DateTime confirmedAt
    +DateTime completedAt
    +DateTime cancelledAt
  }

  class Game {
    +String name
    +String imageUri
    +Boolean realtime
    +Int maxPlayers
  }

  class GameSession {
    +DateTime createdAt
    +DateTime updatedAt
    +GameState state
  }

  class Player {
    +Int score
  }

  class UserRole {
    <<Enumeration>>
    GUEST
    USER
    ADMIN
  }

  class FriendRequestStatus {
    <<Enumeration>>
    Pending
    Accepted
    Rejected
  }

  class InterestLevel {
    <<Enumeration>>
    Moderate
    High
    VeryHigh
  }

  class AttachmentType {
    <<Enumeration>>
    image
    pdf
    text_document
    archive
    word_document
    open_document
  }

  class FileCategory {
    <<Enumeration>>
    image
    document
    archive
    other
  }

  class FileStatus {
    <<Enumeration>>
    uploaded
    attached
    deleted
  }

  class DataRequestType {
    <<Enumeration>>
    export
    deletion
  }

  class DataRequestStatus {
    <<Enumeration>>
    pending
    confirmed
    processing
    completed
    cancelled
    expired
  }

  class ChatType {
    <<Enumeration>>
    Interest
    Group
    Private
  }

  class MessageType {
    <<Enumeration>>
    Normal
    Auto
  }

  class PostType {
    <<Enumeration>>
    Normal
    Auto
  }

  class GameState {
    <<Enumeration>>
    Created
    Playing
    Ended
  }

  class NotifType {
    <<Enumeration>>
    ChannelPost
    PostResponse
    ChatMessage
  }

  UserRole .. User
  FriendRequestStatus .. FriendRequest
  InterestLevel .. UserInterest
  AttachmentType .. FileAsset
  AttachmentType .. Attachment
  FileCategory .. FileAsset
  FileStatus .. FileAsset
  DataRequestType .. DataRequest
  DataRequestStatus .. DataRequest
  ChatType .. Chat
  MessageType .. Message
  PostType .. Post
  GameState .. GameSession
  NotifType .. Notification

  User "1" --> "0..1" Profile : has
  Profile "1" --> "*" ProfileSocial : has
  User "1" --> "*" Session : has
  User "1" --> "*" Account : has

  User "*" --> "*" Interest : has
  User .. UserInterest
  Interest .. UserInterest
  Interest "0..1" --> "*" Interest : children
  Interest "1" --> "0..1" Channel : linked
  User "*" --> "*" Channel : member
  User .. UserChannel
  Channel .. UserChannel

  User "1" --> "*" Post : writes
  Channel "1" --> "*" Post : contains
  Post "0..1" --> "*" Post : replies
  Post "*" --> "*" Interest : tags
  Post "1" --> "*" Reaction : receives
  User "1" --> "*" Reaction : adds

  User "1" --> "*" FileAsset : owns
  FileAsset "1" --> "*" Attachment : file
  Post "0..1" --> "*" Attachment : contains
  Message "0..1" --> "*" Attachment : contains

  User "1" --> "*" FriendRequest : sends
  User "1" --> "*" FriendRequest : receives
  User "*" --> "*" Chat : participates
  Chat "1" --> "*" Message : contains
  User "1" --> "*" Message : writes
  User "1" --> "*" Notification : receives
  Post "0..1" --> "*" Notification : triggers
  Message "0..1" --> "*" Notification : triggers
  User "1" --> "*" DataRequest : requests

  Game "1" --> "*" GameSession : has
  GameSession "1" --> "*" Player : has
  User "1" --> "*" Player : plays
```

## Entity-Relationship Diagram

```mermaid
---
config:
  layout: elk
---
erDiagram
  direction LR

  USER {
    string id PK
    string email UK
    string login UK
    string role
    string name
    boolean emailVerified
    string image
    datetime createdAt
    datetime updatedAt
  }

  PROFILE {
    int id PK
    string firstname
    string lastname
    string pseudo
    datetime birthdate
    string avatarUri
    float level
    string bio
    string userId FK, UK
  }

  PROFILE_SOCIAL {
    int id PK
    string platform
    string label
    string url
    int profileId FK
  }

  SESSION {
    string id PK
    datetime expiresAt
    string token UK
    datetime createdAt
    datetime updatedAt
    string ipAddress
    string userAgent
    string userId FK
  }

  ACCOUNT {
    string id PK
    string accountId
    string providerId
    string userId FK
    string accessToken
    string refreshToken
    string idToken
    datetime accessTokenExpiresAt
    datetime refreshTokenExpiresAt
    string scope
    string password
    datetime createdAt
    datetime updatedAt
  }

  VERIFICATION {
    string id PK
    string identifier
    string value
    datetime expiresAt
    datetime createdAt
    datetime updatedAt
  }

  INTEREST {
    int id PK
    string name UK
    string color
    string imageUri
    int parentId FK
  }

  USER_INTEREST {
    string userId PK, FK
    int interestId PK, FK
    string interestLvl
  }

  CHANNEL {
    int id PK
    int interestId FK, UK
  }

  USER_CHANNEL {
    string userId PK, FK
    int channelId PK, FK
    datetime joinedAt
    boolean isFavorite
  }

  POST {
    int id PK
    datetime createdAt
    string content
    string type
    int parentId FK
    string authorId FK
    int channelId FK
  }

  REACTION {
    int id PK
    string emoji
    string userId FK
    int postId FK
  }

  FILE_ASSET {
    int id PK
    string ownerId FK
    string storageKey UK
    string originalName
    string mimeType
    int sizeBytes
    string category
    string attachmentType
    string status
    datetime createdAt
    datetime updatedAt
  }

  ATTACHMENT {
    int id PK
    string type
    int fileId FK
    int postId FK
    int messageId FK
  }

  FRIEND_REQUEST {
    int id PK
    string senderId FK
    string receiverId FK
    string pairKey UK
    string status
    datetime CreatedAt
    datetime UpdatedAt
  }

  CHAT {
    int id PK
    string name
    string type
  }

  CHAT_TO_USER {
    int A FK
    string B FK
  }

  MESSAGE {
    int id PK
    datetime createdAt
    string content
    string type
    string senderId FK
    int chatId FK
  }

  NOTIFICATION {
    int id PK
    string type
    string userId FK
    int postId FK
    int messageId FK
  }

  INTEREST_TO_POST {
    int A FK
    int B FK
  }

  DATA_REQUEST {
    int id PK
    string userId FK
    string type
    string status
    string confirmationTokenHash UK
    datetime confirmationExpiresAt
    string exportStorageKey
    string exportMimeType
    int exportSizeBytes
    datetime requestedAt
    datetime confirmedAt
    datetime completedAt
    datetime cancelledAt
    datetime updatedAt
  }

  GAME {
    int id PK
    string name
    string imageUri
    boolean realtime
    int maxPlayers
  }

  GAME_SESSION {
    int id PK
    int gameId FK
    datetime createdAt
    datetime updatedAt
    string state
  }

  PLAYER {
    int id PK
    string userId FK
    int sessionId FK
    int score
  }

  USER ||--o| PROFILE : has
  PROFILE ||--o{ PROFILE_SOCIAL : has
  USER ||--o{ SESSION : has
  USER ||--o{ ACCOUNT : has

  USER ||--o{ USER_INTEREST : has
  INTEREST ||--o{ USER_INTEREST : has
  INTEREST ||--o{ INTEREST : parent
  INTEREST ||--o| CHANNEL : owns
  USER ||--o{ USER_CHANNEL : joins
  CHANNEL ||--o{ USER_CHANNEL : has

  USER ||--o{ POST : writes
  CHANNEL ||--o{ POST : contains
  POST ||--o{ POST : parent
  POST ||--o{ REACTION : receives
  USER ||--o{ REACTION : adds
  POST ||--o{ ATTACHMENT : has
  MESSAGE ||--o{ ATTACHMENT : has
  FILE_ASSET ||--o{ ATTACHMENT : backs
  USER ||--o{ FILE_ASSET : owns
  INTEREST ||--o{ INTEREST_TO_POST : tags
  POST ||--o{ INTEREST_TO_POST : tagged

  USER ||--o{ FRIEND_REQUEST : sends
  USER ||--o{ FRIEND_REQUEST : receives

  USER ||--o{ CHAT_TO_USER : participates
  CHAT ||--o{ CHAT_TO_USER : has
  USER ||--o{ MESSAGE : sends
  CHAT ||--o{ MESSAGE : contains

  USER ||--o{ NOTIFICATION : receives
  POST ||--o{ NOTIFICATION : triggers
  MESSAGE ||--o{ NOTIFICATION : triggers

  USER ||--o{ DATA_REQUEST : makes

  GAME ||--o{ GAME_SESSION : has
  GAME_SESSION ||--o{ PLAYER : has
  USER ||--o{ PLAYER : plays

  classDef identity fill:#eef6ff,stroke:#5b7fa6,color:#1f2937
  classDef community fill:#eefaf1,stroke:#5f946a,color:#1f2937
  classDef content fill:#fff6e5,stroke:#a57b36,color:#1f2937
  classDef messaging fill:#f3efff,stroke:#8066b3,color:#1f2937
  classDef games fill:#f7f7f7,stroke:#7a7a7a,color:#1f2937

  class USER,PROFILE,PROFILE_SOCIAL,SESSION,ACCOUNT,VERIFICATION,DATA_REQUEST identity
  class INTEREST,USER_INTEREST,CHANNEL,USER_CHANNEL,INTEREST_TO_POST community
  class POST,REACTION,FILE_ASSET,ATTACHMENT,NOTIFICATION content
  class FRIEND_REQUEST,CHAT,CHAT_TO_USER,MESSAGE messaging
  class GAME,GAME_SESSION,PLAYER games
```
