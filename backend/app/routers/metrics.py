from fastapi import APIRouter
from ..config import settings
from ..schemas import MetricsResponse

router = APIRouter(prefix="/metrics", tags=["Metrics"])

@router.get("", response_model=MetricsResponse)
def get_model_metrics():
    """
    Returns verified reported historical evaluation metrics from model test benchmark.
    Note: These are reported historical test benchmark values, not live inference stats.
    """
    return MetricsResponse(
        map50=settings.BENCHMARK_MAP50,
        map50_95=settings.BENCHMARK_MAP50_95,
        precision=settings.BENCHMARK_PRECISION,
        recall=settings.BENCHMARK_RECALL,
        is_reported_benchmark=True,
        evaluation_dataset="rail_surface (test split)",
        dataset_class_count=1,
        classes=["defect"],
        note="Reported historical test benchmark values from YOLO11s checkpoint validation. Not recalculated from live inference.",
        detailed_metrics={
            "f1_score": round(2 * (settings.BENCHMARK_PRECISION * settings.BENCHMARK_RECALL) / (settings.BENCHMARK_PRECISION + settings.BENCHMARK_RECALL), 2),
            "epochs_trained": 100,
            "batch_size": 16,
            "image_size": 640,
            "loss_box": 1.28,
            "loss_cls": 0.65,
            "loss_dfl": 1.05,
            "speed_inference_ms": 6.8,
            "fitness": 0.427,
        }
    )
