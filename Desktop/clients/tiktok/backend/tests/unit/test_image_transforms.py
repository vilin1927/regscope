"""
Unit tests for image_transforms module.
"""
import os
import sys
import time
import shutil
import tempfile

import numpy as np
import pytest
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from image_transforms import (
    _make_seed,
    transform_single_image,
    transform_single_image_file,
    transform_images_for_variation,
)


@pytest.fixture
def sample_rgb_image():
    """Create a 1080x1920 RGB test image with varied pixel data."""
    arr = np.random.RandomState(42).randint(0, 256, (1920, 1080, 3), dtype=np.uint8)
    return Image.fromarray(arr)


@pytest.fixture
def sample_image_files(tmp_path):
    """Create 3 test image files on disk."""
    paths = []
    for i in range(3):
        p = tmp_path / f"slide_{i}.jpg"
        img = Image.new('RGB', (1080, 1920), color=(100 + i * 50, 80, 60))
        img.save(str(p), quality=95)
        paths.append(str(p))
    return paths


class TestMakeSeed:
    def test_deterministic(self):
        """Same inputs always produce same seed."""
        s1 = _make_seed("p1_t1", 0)
        s2 = _make_seed("p1_t1", 0)
        assert s1 == s2

    def test_different_variation_keys(self):
        """Different variation keys produce different seeds."""
        s1 = _make_seed("p1_t1", 0)
        s2 = _make_seed("p1_t2", 0)
        assert s1 != s2

    def test_different_image_indices(self):
        """Different image indices produce different seeds."""
        s1 = _make_seed("p1_t1", 0)
        s2 = _make_seed("p1_t1", 1)
        assert s1 != s2

    def test_returns_int(self):
        assert isinstance(_make_seed("key", 0), int)


class TestTransformSingleImage:
    def test_preserves_dimensions(self, sample_rgb_image):
        """Transform output must match input dimensions."""
        original_size = sample_rgb_image.size
        result = transform_single_image(sample_rgb_image, "p1_t1", 0)
        assert result.size == original_size

    def test_deterministic_output(self, sample_rgb_image):
        """Same inputs produce identical output pixels."""
        r1 = transform_single_image(sample_rgb_image.copy(), "p1_t1", 0)
        r2 = transform_single_image(sample_rgb_image.copy(), "p1_t1", 0)
        assert np.array_equal(np.array(r1), np.array(r2))

    def test_different_variations_differ(self, sample_rgb_image):
        """Different variation keys produce different pixel data."""
        r1 = transform_single_image(sample_rgb_image.copy(), "p1_t1", 0)
        r2 = transform_single_image(sample_rgb_image.copy(), "p1_t2", 0)
        assert not np.array_equal(np.array(r1), np.array(r2))

    def test_pixels_actually_changed(self, sample_rgb_image):
        """Transform must actually modify pixel data."""
        original_arr = np.array(sample_rgb_image)
        result = transform_single_image(sample_rgb_image.copy(), "p1_t1", 0)
        result_arr = np.array(result)
        assert not np.array_equal(original_arr, result_arr)

    def test_rgba_input_handled(self):
        """RGBA images should be converted to RGB and transformed."""
        img = Image.new('RGBA', (200, 200), color=(255, 0, 0, 128))
        result = transform_single_image(img, "key", 0)
        assert result.mode == 'RGB'
        assert result.size == (200, 200)

    def test_small_image(self):
        """Very small images should not crash."""
        img = Image.new('RGB', (50, 50), color='white')
        result = transform_single_image(img, "key", 0)
        assert result.size == (50, 50)


class TestTransformSingleImageFile:
    def test_transforms_file_in_place(self, tmp_path):
        """File should be modified in-place."""
        p = tmp_path / "test.jpg"
        img = Image.new('RGB', (200, 200), color='red')
        img.save(str(p))
        original_bytes = p.read_bytes()

        result = transform_single_image_file(str(p), "key", 0)

        assert result is True
        assert p.read_bytes() != original_bytes

    def test_returns_false_on_missing_file(self):
        """Should return False (not crash) for missing file."""
        result = transform_single_image_file("/nonexistent/image.jpg", "key", 0)
        assert result is False

    def test_returns_false_on_corrupt_file(self, tmp_path):
        """Should return False for corrupt image data."""
        p = tmp_path / "corrupt.jpg"
        p.write_text("not an image")
        result = transform_single_image_file(str(p), "key", 0)
        assert result is False


class TestTransformImagesForVariation:
    def test_creates_output_files(self, sample_image_files, tmp_path):
        """All images should be written to output dir."""
        out_dir = str(tmp_path / "output")
        results = transform_images_for_variation(sample_image_files, "p1_t1", out_dir)

        assert len(results) == len(sample_image_files)
        for p in results:
            assert os.path.exists(p)

    def test_originals_unchanged(self, sample_image_files, tmp_path):
        """Source files must not be modified."""
        original_data = {}
        for p in sample_image_files:
            with open(p, 'rb') as f:
                original_data[p] = f.read()

        out_dir = str(tmp_path / "output")
        transform_images_for_variation(sample_image_files, "p1_t1", out_dir)

        for p in sample_image_files:
            with open(p, 'rb') as f:
                assert f.read() == original_data[p], f"Original file was modified: {p}"

    def test_different_keys_produce_different_outputs(self, sample_image_files, tmp_path):
        """Two variation keys should produce pixel-different outputs."""
        out1 = str(tmp_path / "out1")
        out2 = str(tmp_path / "out2")
        r1 = transform_images_for_variation(sample_image_files, "p1_t1", out1)
        r2 = transform_images_for_variation(sample_image_files, "p1_t2", out2)

        for p1, p2 in zip(r1, r2):
            arr1 = np.array(Image.open(p1))
            arr2 = np.array(Image.open(p2))
            assert not np.array_equal(arr1, arr2)

    def test_fallback_on_corrupt_image(self, tmp_path):
        """Corrupt images should be copied as-is (graceful fallback)."""
        # Create one good and one corrupt image
        good = tmp_path / "good.jpg"
        Image.new('RGB', (100, 100), 'blue').save(str(good))

        corrupt = tmp_path / "corrupt.jpg"
        corrupt.write_text("not an image")

        out_dir = str(tmp_path / "output")
        results = transform_images_for_variation([str(good), str(corrupt)], "key", out_dir)

        assert len(results) == 2
        # Both files should exist in output
        for p in results:
            assert os.path.exists(p)

    def test_performance(self, sample_image_files, tmp_path):
        """Transforming a single 1080x1920 image should take < 500ms."""
        out_dir = str(tmp_path / "perf")
        # Warm up
        transform_images_for_variation(sample_image_files[:1], "warmup", out_dir)

        out_dir2 = str(tmp_path / "perf2")
        start = time.time()
        transform_images_for_variation(sample_image_files[:1], "perf", out_dir2)
        elapsed_ms = (time.time() - start) * 1000

        assert elapsed_ms < 500, f"Transform took {elapsed_ms:.0f}ms, expected < 500ms"
