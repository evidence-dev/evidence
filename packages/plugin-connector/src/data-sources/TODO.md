When building sources; using `child_process` will help avoid memory constraints for running multiple sources at once;
Switching to `child_process` would also enable the use of something like `blessed` to create a terminal layout with high level spinners on the left, and horizontally split panes for logs from each connector

e.g.

```
       ┌───────────────────┬─────────────────────────────────────────┐
       │ Updating Sources  │ needful_things                          │
       │                   │                                         │
       │ \  needful_things │   log line                              │
       │                   │   log line                              │
       │ |  snowflake      │   log line                              │
       │                   │   log line                              │
       │ /  gsheets        │                                         │
       │                   │                                         │
       │ |  marketing      ├─────────────────────────────────────────┤
       │                   │ gsheets                                 │
       │                   │                                         │
       │                   │   log line                              │
       │                   │   log line                              │
       │                   │   log line                              │
       │                   │                                         │
       │                   │                                         │
       │                   │                                         │
       │                   │                                         │
       └───────────────────┴─────────────────────────────────────────┘
```
