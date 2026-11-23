# @lolcalc/core

Core, game related functionality for lolcalc

## tests

There are tests. Usually there's a fixture a test uses. It should contain all of the data a test needs, so that any changes to the variables introduced in later patches don't break it.

> [!IMPORTANT]
> The tests must expect **concrete**, **non-variable** values observed in the game, no calculations are to be made there. If a test is added, it has to be based on the data seen in game.

When a test has to be updated, recreate and observe its cases in game, then move it and its fixtured data to the current patch. There's a `updateTestFixture` script to help with the fixture data management. Link to the [section describing it](CONTRIBUTING.md#updateTestFixture) in `contributing.md`
