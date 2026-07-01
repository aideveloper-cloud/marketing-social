"""
Marketing Analytics ETL Service
Schedules sync jobs for TikTok Shop
"""
import sys
import structlog
from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.cron import CronTrigger
from config import settings
from scheduler.sync_orders import run as sync_orders

structlog.configure(
    processors=[
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.add_log_level,
        structlog.dev.ConsoleRenderer(),
    ]
)

log = structlog.get_logger(__name__)


def main():
    log.info("etl.start", service="marketing-analytics-etl")

    scheduler = BlockingScheduler(timezone="Asia/Bangkok")

    # Parse cron expressions (format: "min hour dom month dow")
    def _cron(expr: str) -> CronTrigger:
        parts = expr.split()
        return CronTrigger(
            minute=parts[0],
            hour=parts[1],
            day=parts[2] if len(parts) > 2 else "*",
            month=parts[3] if len(parts) > 3 else "*",
            day_of_week=parts[4] if len(parts) > 4 else "*",
        )

    scheduler.add_job(sync_orders, _cron(settings.sync_orders_cron), id="sync_orders", name="Sync Orders (TikTok Shop)")

    log.info("scheduler.jobs", count=len(scheduler.get_jobs()))

    # Run once immediately on startup
    log.info("etl.initial_run")
    sync_orders()

    try:
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        log.info("etl.shutdown")
        sys.exit(0)


if __name__ == "__main__":
    main()
