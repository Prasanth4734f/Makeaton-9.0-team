"""Demo package for Revora Intelligence Engine."""

def get_demo_dataset():
    from intelligence_engine.demo.demo_data import get_demo_dataset as _get
    return _get()

def run_demo():
    from intelligence_engine.demo.demo_data import run_demo as _run
    return _run()

__all__ = ["get_demo_dataset", "run_demo"]
