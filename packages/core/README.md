# @lolcalc/core

Core, game related functionality for lolcalc

## tests

At the moment there are tests for `@lolcalc/calculate/championStats.ts` that check whether the calculations are accurate.

They are structured by patch, with a fixture, like

```
16.9.1.fixture.json
16.9.1.test.ts
```

where the fixture contains the overrides of the game data relevant to the test.

> [!IMPORTANT]
> The tests must expect **concrete**, **non-variable** values observed in the game, no calculations are to be made there.

When test has to be updated, recreate and observe the test cases in game, then move it and its fixtured data to the current patch.
