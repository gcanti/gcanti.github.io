---
layout: post
title: A Proposal To Document JSON Structures
---

## The problem

There is no standard way to describe the structure of a JSON. You might use:

- [JsDoc](http://usejsdoc.org/)
- [JSON Schema](http://json-schema.org/)

but the most common way is to give examples of the returned JSON: [Twitter REST APIs](https://dev.twitter.com/rest/public) or [GitHub REST APIs](https://developer.github.com/v3/).

## What's wrong?

- **JsDoc** is an external DSL and is not powerful enough (no subtypes)
- **JSON Schema** is verbose and is not powerful enough (no subtypes)
- **examples** of the returned JSON doesn't even adhere to a spec and must be parsed by humans
