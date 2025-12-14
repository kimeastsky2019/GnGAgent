from fastapi import APIRouter, Query

router = APIRouter()

@router.get("")
def fetch_timeseries(sim_run_id: int, signal: str, asset_id: int | None = None,
                     from_: str | None = Query(None, alias="from"),
                     to: str | None = None):
    # TODO: select from hypertables
    return {"sim_run_id": sim_run_id, "signal": signal, "points": []}
