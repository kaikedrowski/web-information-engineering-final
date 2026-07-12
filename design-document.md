# Microblogging Web Application Design Document

**App name: Apple Tree**

**Group Members:**
1. Jonathan Setiawan / 2600240466-3
2. Chan Man Mong / 2600230448-0
3. Kaito Sugaya / 8132260011-9
4. Steven Spiliopoulos / 8132260013-5
5. Andrei Preoteasa / 8532260002-5

## 2.1 Application Overview

Apple Tree is a microblogging web application with a singular rule, that nothing on the platform is permanent. Every post is published with a timer, the default being 24 hours, and they disappear when the timer runs out. The feed is therefore never an archive, but rather, a shifting landscape of the current topics and trends. One can imagine the posts as apples growing on a tree, but falling off as they ripen.

Based on this concept, the team built a system where pseudonymous users interact with the platform. Accounts exist in the typical sense, where users log in, view posts under profiles, and follow other users. However, the platform is designed not to accumulate a paper trail of any user, in accordance with the aforementioned concept of timers.

Since posts are in a constant cycle of life and death, it could flood users with many unfamiliar topics. In order to solve this, each post has hashtags, allowing users to sort by topics in this way. Hashtags would provide a way to navigate this complexity, creating a method for posts to be classified and sought out, rather than simply going about their life cycles while being displayed arbitrarily to users who have no interest in the topic.

Posts under each hashtag would also be ordered by likes, having a button which viewers can click if they enjoy the content. Since post lifetime is limited, each post would have its time to shine, accumulating likes and potentially climbing to the top of the feed before deletion.

These concepts would fundamentally set Apple Tree apart from generic CRUD applications, where data is often sorted by trending topics or complex "for you page" algorithms, and then kept in the database forever unless deleted. It would also allow for a much more lightweight and minimalist platform.

## 2.2 Architecture Diagram

This figure shows the UML Component Diagram for Apple Tree. The application consists of three major components: the Vite frontend, Express server, and SQLite database. The diagram illustrates how the frontend Vite application communicates with the Express backend, which then delegates requests to the corresponding route component, which can then interact with the database via the Database Interface.

## 2.3 Data Model

The data model of our system consists of 6 relational tables. For instance, the "users" and "posts" serve as the core entities of Apple Tree. The "follows" table serves as the required self-referential, modelling the many-to-many relationship between users. The "hashtags" and "post hash-tags" tables serve as the top classification, so one post can contain multiple hashtags, and each hashtag can be associated with multiple posts. The "likes" table represents user engagement, modelling another many-to-many relationship by recording which users had liked which post.

In order to allow temporary posts in Apple Tree, each post stores a timestamp "posts.expires_at". The feed would only display posts which have not exceeded the expiration time. Also, the number of views of each post would be stored in the "posts.view_count" attribute, allowing display of the author metrics.

Media attachments such as images and videos would be stored in the "posts" table, as a single nullable column. This function would limit only one media attachment per each post, matching our "one image per post" scope. This aims to minimize the redundancy of Apple Tree, while queries of users, posts, hashtags, likes, follows can still be obtained efficiently.

Follower/following and like counts are derived using SQL (`COUNT()`), they are never stored in the database directly. This prevents the data from drifting out of sync with the underlying edges since the display count would always remain consistent.

## 2.4 API Design

Apple Tree provides a REST API for the frontend to interact with the Express server. It is organized into route groups of: auth, posts, users, hashtags, relative to the base URL of "http://localhost:3000/api/." These routes were chosen in order to organize API endpoints by their different uses. 'auth' is for authentication-adjacent functions such as login and register, 'posts' is for interacting with posts and the feed, 'users' is for interacting with user profiles, and 'hashtags' is for sorting posts by hashtag. JSON Web Token (JWT) authentication is used for the authentication functions of the application, where a secure token is issued to users by the server, and it is sent back by the client in order to prove its identity. JWT uses stateless authentication, where the server does not have to keep track of logged in users, since a valid token sent by a client implies that a user is currently logged in and may access certain data. Following a successful login via username and password, the server creates a new JWT, signs it using the string JWT_SECRET from the .env file, and passes it back to the client. When the client makes API calls, it takes the saved token from localStorage and passes it as an HTTP authorization header, with the server either verifying the token, or returning 401 Unauthorized as a response code. Restricted endpoints ensure that a user is logged in by checking that jwt.verify returns no errors. In the posts route, timed-out posts (posts that have been posted over 24 hours ago) are filtered out by comparing the current time to the expires_at tag. The feed is also generated each time it is requested, sorted by newest.

## 2.5 Influence from Real Platforms

The mechanic where posts disappear after 24 hours is influenced by two real features from microblogging platforms. Instagram and Snapchat are both SNS platforms where users can post something to their "story" and it will disappear after 24 hours. X also implemented a similar feature, known as "fleets," in the past. The second feature which the team took inspiration from is Mastodon's automated post deletion setting, which also automatically deletes posts after a certain period. This is different from typical story features, since they display as normal posts in the feed interface.

Hashtags are another feature, influenced by the concept of hashtags from Instagram and X. However, in Apple Tree, hashtags are used somewhat differently. Rather than being a marker for posts in a larger algorithmic feed, they serve as the basis for topic sorting, especially since a smart algorithm for the feed has not been developed. In some ways, this is comparable to a Reddit subreddit, although each post allows multiple hashtags.

## 2.6 Trade-offs and Scope Decisions

The first trade-off made was to sort the feed by most recent. This was in contrast to the typical algorithmic feeds of social media platforms. This was chosen since it could be implemented via a simple SQL sort, without any extra algorithmic computation involved, which would significantly reduce complexity. This also ties into the concept of posts being temporary, with new posts being pushed to the top of the feed and going through a 24 hour life cycle.

Another trade-off was to use a simple stateless JWT implementation rather than often used session management strategies. Many production platforms use more intensive state tracking. On the contrary, stateless JWT requires no server-side state tracking, making for a much simpler authentication system in the application.