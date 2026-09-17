# @lolcalc/core

Core, game related functionality for lolcalc

## tests

There are tests. Usually there's a fixture a test uses. It should contain all of the data a test needs, so that any changes to the variables introduced in later patches don't break it.

> [!IMPORTANT]
> The tests must expect **concrete**, **non-variable** values observed in the game, no calculations are to be made there. If test is added, it has to be based on data seen in game.

When test has to be updated, recreate and observe the test cases in game, then move it and its fixtured data to the current patch.
