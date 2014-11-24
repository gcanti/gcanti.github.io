Risorse su React vdom, diff, etc..

- http://calendar.perfplanet.com/2013/diff/
- https://www.youtube.com/watch?v=eCf5CquV_Bw
- http://blog.circleci.com/local-state-global-concerns/
- With this simple skeleton I implemented a (hopefully neat) todomvc, check out the [demo](http://jsfiddle.net/u47c821n/)

```
                        (view, controller) -> uvdom
                                |
initialState --> state ------------------> render(uvdom) <-- diff algorithm
                   Ʌ                            |
                   |                            | <-- view event
                   |                            |
                   +-------- transition --------+ <-- server event
                                |
                    (state, event) -> new state
```