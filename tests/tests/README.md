# CodeFlare Platform Test Definitions

This document provides a test coverage table. For larger scale tests
(those with a Use Case), the table clarifies whether we have validated
the coverage with the original owner of that use case's code.

## Coverage Table

| Test Name | API      | Use Case | Validated? | GPU?/Tested? | Has Dataset? | Expect Failure   | Notes        |
|-----------|----------|----------|------------|--------------|--------------|------------------|--------------|
| hap       | ray      | IBM LLM  |    TODO!   |    Yes/Yes   |     Yes      |                  |              |
| lightning | torch    | Examples |    TODO!   |    Yes/Yes   |              |                  |              |
| qiskit    | ray      | Examples |    TODO!   |              |              |                  |              |
| test0     | n/a      |          |            |              |              | Yes: missing App |              |
| test0b    | n/a      |          |            |              |              | Yes: bogus repo  |              |
| test1     | ray      |          |            |              |     Yes      |                  |              |
| test2     | torch    |          |            |              |              |                  |              |
| test3     | <deleted>|          |            |              |              |                  |              |
| test4     | sequence |          |            |              |              |                  |              |
| test5     | torch    |          |            |    Yes/Yes   |              |                  |              |
| test6     | shell    |          |            |              |              |                  |              |
| test7     | workqueue|          |            |              |              |                  |              |
| test7b    | workqueue|          |            |              |              |                  | code literal |
| test8     | spark    |          |            |              |              |                  |              |
| test9     | spark    |          |            |              |     Yes      |                  |              |
