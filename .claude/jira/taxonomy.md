# Jira taxonomy for smart-clearance

Site `https://duttaarun2015.atlassian.net`, cloudId `81c51173-bbea-4905-bbc5-1a880fa348bb`, project key `SC`. Written by
`/jira-flow:init` on 2026-10-02; edit it as the backlog grows. The ids the
tools need (transitions, fields) live in `.claude/jira-flow.json`; this file
holds what a person decides: where work goes, how issues are written.

## Hierarchy

| Level | Jira type | Meaning here |
| --- | --- | --- |
| Feature | **Epic** | One shippable capability |
| Story / Task / Bug | Story, Task, Bug | One PR-sized unit of work |
| Subtask | Subtask | Only when a story needs a checklist tracked separately |

## Epics

| Key | Summary | Labels |
| --- | --- | --- |
| (none yet) | The project is empty; the first epics follow the six build steps in docs/smart-clearance-tech-stack.html: data and money maths, agent event stream, Command Center and Route Room, Execution and ExpireSoon, Paperwork and Finance & ESG, demo script | |

Where a change goes, by path (fill this in as the repo's shape settles):

| Path | Epic |
| --- | --- |
| `web/**` | |
| `agents/**` | |
| `infra/**` | |
| `video/**`, `docs/**` | |
| `.github/**`, `.claude/**`, repo docs | |

## Labels

(none in use yet)

Bugs are type `Bug` and also carry the `bug` label so one JQL
covers them.

## Statuses and transitions

| Status | transitionId | When |
| --- | --- | --- |
| To Do | 11 | created |
| In Progress | 21 | first edit for the story |
| In Review | 31 | PR raised |
| Done | 41 | PR merged (only when asked) |

## Story template

```
As <the user | the developer | the operator> I want <outcome> so that <why>.

**Where.** <paths>
**Acceptance.**
- <observable result 1>
- <observable result 2>
- Gates: <lint/typecheck/test/build ...>; verified on <what>
**Depends on.** <keys, or none>
```

## Bug template (issue type Bug, plus label `bug`)

```
**Where.** <surface, platform, environment>
**Version / build.** <branch or commit, device or runtime, OS version>
**Steps.** 1. ... 2. ...
**Actual.** ...
**Expected.** ...
**Evidence.** <screenshot path, failing test name, log excerpt>
**Suspect.** <file:line if known>
```

## Epic template

```
**Goal.** <one paragraph>
**Where.** <paths>
**Done when.** <the observable end state>
**Rules.** <the .claude/rules and skills that apply>
```

## Comment template (on landing a change)

```
**Change.** <one line>
**Files.** <list, grouped>
**Gates.** <name: result, ...>
**Verified.** <what was looked at; evidence path>
**Open.** <follow-up keys created, or none>
**Branch.** <name> at <short sha>
```

## JQL you will use

- In flight: `project = SC AND status = "In Progress" ORDER BY updated DESC`
- Waiting on merge: `project = SC AND status = "In Review" ORDER BY updated DESC`
- Next up: `project = SC AND status = "To Do" AND issuetype != Epic ORDER BY priority DESC, Rank ASC`
- An epic's children: `project = SC AND parent = SC-<n> ORDER BY status, Rank`
- Bugs: `project = SC AND (issuetype = Bug OR labels = bug) AND statusCategory != Done`
- Duplicate check before creating: `project = SC AND summary ~ "<two or three words>"`
