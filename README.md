# Purpose

Reindex ElasticSearch cluster to another using Elasticdump with multiple threads (replacement of ElasticMultiDump?)

We do a few things:
1. Try to run in cluster mode with multiple forks
2. While transferring - compare the counts at source - if same, ignore
3. Transfer the settings before transferring data
4. Set the replicas to 0 and refresh interval to a higher number

# Configuration

You can specify your parameters in config.local.json to override default configuration. Typically, you just need to specify source and target configurations.
Take a look at config.json for sample, copy to config.local.json and modify as needed.

