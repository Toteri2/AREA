## Overview

MongoDB is a NoSQL document database that stores data in BSON format. It offers schema flexibility and horizontal scaling capabilities through sharding.

## Strengths

**Schema Flexibility**
- Documents can have different structures
- No migrations required for schema changes
- Fields can be added on-the-fly

**Horizontal Scaling**
- Native sharding across multiple servers
- Automatic data distribution
- Built for distributed architectures

**Simple Writes**
- Fast single-document inserts without transactions
- Good throughput for basic operations

## Limitations

**No Native Relationships**
- References must be managed manually in application code
- No CASCADE operations for deletions
- Risk of orphaned data (actions without parent flow)

**Join Performance**
- $lookup aggregations are significantly slower than SQL JOINs
- Multiple lookups compound the performance gap
- Complex queries become verbose

**Transaction Overhead**
- Requires replica set configuration even for development
- Transaction performance slower than SQL databases
- Additional infrastructure complexity

**Analytics Performance**
- Aggregation pipelines are verbose to write
- Slower execution on complex queries
- GROUP BY operations less optimized

**TypeORM Support**
- Limited support
- Integration with NestJS is less seamless compared to others
- TypeScript type safety is weaker due to MongoDB's flexible schema

## Performance Results

| Operation               | Median   | Notes                      |
| ----------------------- | -------- | -------------------------- |
| INSERT (transaction)    | 6.21ms   | Flow + trigger + 3 actions |
| SELECT (with $lookup)   | 0.52ms   | Fetch flow with relations  |
| Analytics (aggregation) | 170.89ms | TOP 100 flows with counts  |

## Fit for AREA

MongoDB struggles with the AREA data model. The relational structure (`users → flows → triggers/actions`) doesn't map naturally to document storage.

INSERT performance with transactions is close to PostgreSQL, but that requires replica set setup which adds complexity. Without transactions, you risk incomplete flow creation if errors occur mid-process.

The real problem is analytics. Dashboard queries that show TOP flows, success rates, or action counts take 24x longer than PostgreSQL. For a user-facing dashboard, that's the difference between instant response and noticeable lag.

The lack of foreign keys means you need to manually handle flow deletion cascades. Forget to delete related triggers/actions and you'll accumulate orphaned data.

Sharding is MongoDB's main advantage, but AREA won't need that scale until well past 1M+ users. By that point, PostgreSQL read replicas and vertical scaling will handle the load.

MongoDB works better for logs, events, or microservices with independent data models. For AREA's relational structure with dashboard requirements, it's not the right fit.
