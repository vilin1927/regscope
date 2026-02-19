"""
Tests for Per-Clip Text Support in Instagram Reel Generator.

Covers:
1. generate_combinations() — per-clip mode and legacy backward compat
2. Database — clip_texts_json storage and retrieval
3. API /generate endpoint — per-clip text validation and legacy mode
"""
import json
import os
import sys
import pytest
import tempfile
import sqlite3

# Add backend directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


# ─── Fixtures ────────────────────────────────────────────────────────────────

@pytest.fixture(scope='function')
def ig_test_db():
    """Create isolated test database with IG reel tables."""
    temp_db = tempfile.NamedTemporaryFile(suffix='.db', delete=False)
    temp_db.close()

    import database
    original_db_path = database.DB_PATH
    database.DB_PATH = temp_db.name

    database.init_db()
    database.init_ig_reel_tables()

    yield temp_db.name

    database.DB_PATH = original_db_path

    try:
        os.unlink(temp_db.name)
    except Exception:
        pass


@pytest.fixture
def sample_format(ig_test_db):
    """Create a 4-clip format template (matches Jenny's DU4Un3rk1E8 reel)."""
    from database import create_ig_format
    clips = [
        {'index': 0, 'duration': 2.0, 'type': 'before', 'has_text': True, 'text_style': 'hook',
         'detected_text': 'POV:', 'text_position': 'center'},
        {'index': 1, 'duration': 3.0, 'type': 'before', 'has_text': True, 'text_style': 'hook',
         'detected_text': '18kg gone in 21 days', 'text_position': 'bottom'},
        {'index': 2, 'duration': 3.0, 'type': 'after', 'has_text': True, 'text_style': 'hook',
         'detected_text': 'By using a simple 3 minute routine', 'text_position': 'bottom'},
        {'index': 3, 'duration': 2.5, 'type': 'cta', 'has_text': True, 'text_style': 'cta',
         'detected_text': 'Details in caption', 'text_position': 'bottom'},
    ]
    fmt_id = create_ig_format(
        format_name='jenny-test-4clip',
        clips_json=json.dumps(clips),
        total_duration=10.5,
    )
    return fmt_id, clips


@pytest.fixture
def legacy_format(ig_test_db):
    """Create a simple 3-clip format (before/after/cta) for legacy testing."""
    from database import create_ig_format
    clips = [
        {'index': 0, 'duration': 3.0, 'type': 'before', 'text_position': 'bottom'},
        {'index': 1, 'duration': 3.0, 'type': 'after', 'text_position': 'bottom'},
        {'index': 2, 'duration': 2.0, 'type': 'cta', 'text_position': 'bottom'},
    ]
    fmt_id = create_ig_format(
        format_name='legacy-3clip',
        clips_json=json.dumps(clips),
        total_duration=8.0,
    )
    return fmt_id, clips


@pytest.fixture
def sample_character(ig_test_db, tmp_path):
    """Create a character with before/after photo assets."""
    from database import create_ig_character, create_ig_asset

    char_id = create_ig_character('olivia-test')

    # Create dummy image files
    before_path = str(tmp_path / 'before_01.jpg')
    after_path = str(tmp_path / 'after_01.jpg')
    for p in (before_path, after_path):
        with open(p, 'wb') as f:
            f.write(b'\xff\xd8\xff' + b'\x00' * 100)  # Minimal JPEG header

    before_id = create_ig_asset(char_id, 'before_photo', before_path, 'before_01.jpg')
    after_id = create_ig_asset(char_id, 'after_photo', after_path, 'after_01.jpg')

    return {
        'id': char_id,
        'name': 'olivia-test',
        'before_photos': [{'id': before_id, 'file_path': before_path}],
        'after_photos': [{'id': after_id, 'file_path': after_path}],
        'before_videos': [],
        'after_videos': [],
    }


@pytest.fixture
def multi_asset_character(ig_test_db, tmp_path):
    """Create a character with multiple before/after photo assets."""
    from database import create_ig_character, create_ig_asset

    char_id = create_ig_character('chloe-test')
    before_photos = []
    after_photos = []

    for i in range(3):
        bp = str(tmp_path / f'before_{i:02d}.jpg')
        ap = str(tmp_path / f'after_{i:02d}.jpg')
        for p in (bp, ap):
            with open(p, 'wb') as f:
                f.write(b'\xff\xd8\xff' + b'\x00' * 100)
        b_id = create_ig_asset(char_id, 'before_photo', bp, f'before_{i:02d}.jpg')
        a_id = create_ig_asset(char_id, 'after_photo', ap, f'after_{i:02d}.jpg')
        before_photos.append({'id': b_id, 'file_path': bp})
        after_photos.append({'id': a_id, 'file_path': ap})

    return {
        'id': char_id,
        'name': 'chloe-test',
        'before_photos': before_photos,
        'after_photos': after_photos,
        'before_videos': [],
        'after_videos': [],
    }


# ═══════════════════════════════════════════════════════════════════════════════
# TEST GROUP 1: generate_combinations() — Per-Clip Text Mode
# ═══════════════════════════════════════════════════════════════════════════════

class TestGenerateCombinationsPerClip:
    """Test generate_combinations() with the new per-clip text mode."""

    def test_basic_per_clip_4_texts(self, sample_format, sample_character):
        """4 clips each with their own text, 1 variation — matches Jenny's use case."""
        from reel_video_generator import generate_combinations

        _, clips = sample_format
        clip_texts = [
            {'text': 'POV:', 'style': 'hook'},
            {'text': '18kg gone in 21 days', 'style': 'hook'},
            {'text': 'By using a simple 3 minute routine', 'style': 'hook'},
            {'text': 'Details in caption', 'style': 'cta'},
        ]
        clip_variations = [
            ['POV:'],
            ['18kg gone in 21 days'],
            ['By using a simple 3 minute routine'],
            ['Details in caption'],
        ]

        configs = generate_combinations(
            format_clips=clips,
            characters=[sample_character],
            clip_variations=clip_variations,
            clip_texts=clip_texts,
            num_videos=1,
        )

        assert len(configs) == 1
        config = configs[0]
        assert len(config['clips_config']) == 4

        # Verify each clip has its own text
        assert config['clips_config'][0]['text'] == 'POV:'
        assert config['clips_config'][0]['text_style'] == 'hook'
        assert config['clips_config'][1]['text'] == '18kg gone in 21 days'
        assert config['clips_config'][2]['text'] == 'By using a simple 3 minute routine'
        assert config['clips_config'][3]['text'] == 'Details in caption'
        assert config['clips_config'][3]['text_style'] == 'cta'

    def test_per_clip_with_variations(self, sample_format, sample_character):
        """Per-clip with 2 variations per clip — text_var_idx indexes all clips simultaneously."""
        from reel_video_generator import generate_combinations

        _, clips = sample_format
        clip_texts = [
            {'text': 'POV:', 'style': 'hook'},
            {'text': '18kg gone', 'style': 'hook'},
            {'text': 'Simple routine', 'style': 'hook'},
            {'text': 'Details below', 'style': 'cta'},
        ]
        clip_variations = [
            ['POV:', 'POV: imagine this'],
            ['18kg gone', '20kg lost'],
            ['Simple routine', 'Easy 3 min trick'],
            ['Details below', 'Check caption'],
        ]

        configs = generate_combinations(
            format_clips=clips,
            characters=[sample_character],
            clip_variations=clip_variations,
            clip_texts=clip_texts,
            num_videos=2,
        )

        assert len(configs) == 2

        # Sort by text_variation_index to make assertions deterministic
        configs.sort(key=lambda c: c['text_variation_index'])

        # Variation 0
        c0 = configs[0]['clips_config']
        assert c0[0]['text'] == 'POV:'
        assert c0[1]['text'] == '18kg gone'
        assert c0[2]['text'] == 'Simple routine'
        assert c0[3]['text'] == 'Details below'

        # Variation 1
        c1 = configs[1]['clips_config']
        assert c1[0]['text'] == 'POV: imagine this'
        assert c1[1]['text'] == '20kg lost'
        assert c1[2]['text'] == 'Easy 3 min trick'
        assert c1[3]['text'] == 'Check caption'

    def test_per_clip_empty_text_clips(self, sample_format, sample_character):
        """Clips with empty text get text=None."""
        from reel_video_generator import generate_combinations

        _, clips = sample_format
        clip_texts = [
            {'text': 'POV:', 'style': 'hook'},
            {'text': '', 'style': 'hook'},       # No text on this clip
            {'text': 'Result', 'style': 'hook'},
            {'text': '', 'style': 'cta'},         # No text on CTA either
        ]
        clip_variations = [
            ['POV:'],
            [''],           # Empty variation
            ['Result'],
            [''],           # Empty variation
        ]

        configs = generate_combinations(
            format_clips=clips,
            characters=[sample_character],
            clip_variations=clip_variations,
            clip_texts=clip_texts,
            num_videos=1,
        )

        assert len(configs) == 1
        cc = configs[0]['clips_config']

        assert cc[0]['text'] == 'POV:'
        assert cc[1]['text'] is None    # Empty text → None
        assert cc[2]['text'] == 'Result'
        assert cc[3]['text'] is None    # Empty text → None

    def test_per_clip_dedup(self, sample_format, sample_character):
        """Same text variation + same assets = deduplicated."""
        from reel_video_generator import generate_combinations

        _, clips = sample_format
        clip_texts = [
            {'text': 'Same', 'style': 'hook'},
            {'text': 'Same', 'style': 'hook'},
            {'text': 'Same', 'style': 'hook'},
            {'text': 'Same', 'style': 'cta'},
        ]
        # 1 variation only — can only produce 1 unique combo per character
        clip_variations = [['Same'], ['Same'], ['Same'], ['Same']]

        configs = generate_combinations(
            format_clips=clips,
            characters=[sample_character],
            clip_variations=clip_variations,
            clip_texts=clip_texts,
            num_videos=5,  # Requesting more than possible
        )

        # Only 1 unique combo possible (1 character × 1 before × 1 after × 1 text variation)
        assert len(configs) == 1

    def test_per_clip_multiple_characters(self, sample_format, sample_character, multi_asset_character):
        """Multiple characters multiply the available combinations."""
        from reel_video_generator import generate_combinations

        _, clips = sample_format
        clip_texts = [
            {'text': 'POV:', 'style': 'hook'},
            {'text': 'Gone', 'style': 'hook'},
            {'text': 'Routine', 'style': 'hook'},
            {'text': 'CTA', 'style': 'cta'},
        ]
        clip_variations = [['POV:'], ['Gone'], ['Routine'], ['CTA']]

        configs = generate_combinations(
            format_clips=clips,
            characters=[sample_character, multi_asset_character],
            clip_variations=clip_variations,
            clip_texts=clip_texts,
            num_videos=10,
        )

        # sample_character: 1 before × 1 after = 1 combo
        # multi_asset_character: 3 before × 3 after = 9 combos
        # Total: 10 × 1 text variation = 10
        assert len(configs) == 10


# ═══════════════════════════════════════════════════════════════════════════════
# TEST GROUP 2: generate_combinations() — Legacy Backward Compatibility
# ═══════════════════════════════════════════════════════════════════════════════

class TestGenerateCombinationsLegacy:
    """Test generate_combinations() with legacy hook_text/cta_text params."""

    def test_legacy_hook_and_cta(self, legacy_format, sample_character):
        """Legacy mode: text_variations → before clips, cta_variations → cta clips."""
        from reel_video_generator import generate_combinations

        _, clips = legacy_format

        configs = generate_combinations(
            format_clips=clips,
            characters=[sample_character],
            text_variations=['Amazing hook!'],
            cta_variations=['Buy now!'],
            num_videos=1,
        )

        assert len(configs) == 1
        cc = configs[0]['clips_config']

        # before clip → hook text
        assert cc[0]['text'] == 'Amazing hook!'
        assert cc[0]['text_style'] == 'hook'

        # after clip → no text (legacy: after has_text=False by default)
        assert cc[1]['text'] is None

        # cta clip → cta text
        assert cc[2]['text'] == 'Buy now!'
        assert cc[2]['text_style'] == 'cta'

    def test_legacy_multiple_hook_variations(self, legacy_format, sample_character):
        """Multiple hook variations produce multiple combos."""
        from reel_video_generator import generate_combinations

        _, clips = legacy_format

        configs = generate_combinations(
            format_clips=clips,
            characters=[sample_character],
            text_variations=['Hook A', 'Hook B', 'Hook C'],
            cta_variations=['CTA'],
            num_videos=3,
        )

        assert len(configs) == 3
        hooks_used = {c['clips_config'][0]['text'] for c in configs}
        assert hooks_used == {'Hook A', 'Hook B', 'Hook C'}

    def test_legacy_no_cta(self, legacy_format, sample_character):
        """Legacy with no CTA text still works."""
        from reel_video_generator import generate_combinations

        _, clips = legacy_format

        configs = generate_combinations(
            format_clips=clips,
            characters=[sample_character],
            text_variations=['Hook only'],
            cta_variations=None,
            num_videos=1,
        )

        assert len(configs) == 1
        cc = configs[0]['clips_config']
        assert cc[0]['text'] == 'Hook only'
        # CTA clip gets empty string variation → None
        assert cc[2]['text'] is None

    def test_legacy_with_has_text_and_text_style(self, ig_test_db, sample_character):
        """Legacy mode respects has_text/text_style fields from scraper."""
        from database import create_ig_format
        from reel_video_generator import generate_combinations

        clips = [
            {'index': 0, 'duration': 2.0, 'type': 'before', 'has_text': True, 'text_style': 'hook'},
            {'index': 1, 'duration': 3.0, 'type': 'after', 'has_text': True, 'text_style': 'hook'},
            {'index': 2, 'duration': 2.0, 'type': 'cta', 'has_text': False, 'text_style': 'cta'},
        ]
        create_ig_format('custom-legacy', clips_json=json.dumps(clips))

        configs = generate_combinations(
            format_clips=clips,
            characters=[sample_character],
            text_variations=['My hook'],
            cta_variations=['My CTA'],
            num_videos=1,
        )

        cc = configs[0]['clips_config']
        assert cc[0]['text'] == 'My hook'     # before + has_text=True → hook
        assert cc[1]['text'] == 'My hook'     # after + has_text=True → hook (overridden)
        assert cc[2]['text'] is None          # cta + has_text=False → no text


# ═══════════════════════════════════════════════════════════════════════════════
# TEST GROUP 3: generate_combinations() — Edge Cases
# ═══════════════════════════════════════════════════════════════════════════════

class TestGenerateCombinationsEdgeCases:
    """Edge cases and error handling."""

    def test_no_characters_raises(self, sample_format):
        """Empty characters list raises ReelVideoError."""
        from reel_video_generator import generate_combinations, ReelVideoError

        _, clips = sample_format
        with pytest.raises(ReelVideoError, match="No characters"):
            generate_combinations(
                format_clips=clips,
                characters=[],
                text_variations=['Hook'],
                num_videos=1,
            )

    def test_character_without_assets_skipped(self, sample_format):
        """Character with no matching assets is skipped gracefully."""
        from reel_video_generator import generate_combinations, ReelVideoError

        _, clips = sample_format
        empty_char = {
            'id': 'empty',
            'name': 'empty',
            'before_photos': [],
            'after_photos': [],
            'before_videos': [],
            'after_videos': [],
        }

        # Only one character with no assets → no combos → error
        with pytest.raises(ReelVideoError, match="No valid combinations"):
            generate_combinations(
                format_clips=clips,
                characters=[empty_char],
                text_variations=['Hook'],
                num_videos=1,
            )

    def test_request_more_than_available(self, sample_format, sample_character):
        """Requesting more videos than unique combos returns max available."""
        from reel_video_generator import generate_combinations

        _, clips = sample_format
        clip_texts = [{'text': 'T', 'style': 'hook'}] * 4
        clip_variations = [['T']] * 4

        configs = generate_combinations(
            format_clips=clips,
            characters=[sample_character],
            clip_variations=clip_variations,
            clip_texts=clip_texts,
            num_videos=100,  # Way more than possible
        )

        # 1 char × 1 before × 1 after × 1 text_var = 1
        assert len(configs) == 1

    def test_video_number_sequential(self, sample_format, multi_asset_character):
        """Video numbers are assigned 1..N sequentially."""
        from reel_video_generator import generate_combinations

        _, clips = sample_format
        clip_texts = [{'text': 'T', 'style': 'hook'}] * 4
        clip_variations = [['T']] * 4

        configs = generate_combinations(
            format_clips=clips,
            characters=[multi_asset_character],
            clip_variations=clip_variations,
            clip_texts=clip_texts,
            num_videos=5,
        )

        numbers = [c['video_number'] for c in configs]
        assert numbers == list(range(1, len(configs) + 1))

    def test_clip_duration_preserved(self, sample_format, sample_character):
        """Each clip's duration from the format template is preserved in the config."""
        from reel_video_generator import generate_combinations

        _, clips = sample_format
        clip_texts = [{'text': 'T', 'style': 'hook'}] * 4
        clip_variations = [['T']] * 4

        configs = generate_combinations(
            format_clips=clips,
            characters=[sample_character],
            clip_variations=clip_variations,
            clip_texts=clip_texts,
            num_videos=1,
        )

        cc = configs[0]['clips_config']
        assert cc[0]['duration'] == 2.0
        assert cc[1]['duration'] == 3.0
        assert cc[2]['duration'] == 3.0
        assert cc[3]['duration'] == 2.5


# ═══════════════════════════════════════════════════════════════════════════════
# TEST GROUP 4: Database — clip_texts_json
# ═══════════════════════════════════════════════════════════════════════════════

class TestDatabaseClipTexts:
    """Test clip_texts_json column in ig_jobs table."""

    def test_create_job_with_clip_texts(self, ig_test_db, sample_format):
        """clip_texts_json is stored and retrieved correctly."""
        from database import create_ig_job, get_ig_job

        fmt_id, _ = sample_format
        clip_texts = [
            {'text': 'POV:', 'style': 'hook'},
            {'text': '18kg gone', 'style': 'hook'},
            {'text': 'Routine', 'style': 'hook'},
            {'text': 'Details', 'style': 'cta'},
        ]

        job_id = create_ig_job(
            format_id=fmt_id,
            num_videos=5,
            clip_texts_json=json.dumps(clip_texts),
            character_ids_json=json.dumps(['char1']),
        )

        job = get_ig_job(job_id)
        assert job is not None
        assert job['clip_texts_json'] == json.dumps(clip_texts)
        # Auto-parsed field
        assert 'clip_texts' in job
        assert isinstance(job['clip_texts'], list)
        assert len(job['clip_texts']) == 4
        assert job['clip_texts'][0]['text'] == 'POV:'

    def test_create_job_without_clip_texts(self, ig_test_db, sample_format):
        """Legacy job creation without clip_texts_json still works."""
        from database import create_ig_job, get_ig_job

        fmt_id, _ = sample_format

        job_id = create_ig_job(
            format_id=fmt_id,
            num_videos=3,
            hook_text='Legacy hook',
            cta_text='Legacy CTA',
            character_ids_json=json.dumps(['char1']),
        )

        job = get_ig_job(job_id)
        assert job is not None
        assert job['hook_text'] == 'Legacy hook'
        assert job['cta_text'] == 'Legacy CTA'
        assert job.get('clip_texts_json') is None

    def test_list_jobs_includes_clip_texts(self, ig_test_db, sample_format):
        """list_ig_jobs parses clip_texts_json correctly."""
        from database import create_ig_job, list_ig_jobs

        fmt_id, _ = sample_format
        clip_texts = [{'text': 'Test', 'style': 'hook'}]

        create_ig_job(
            format_id=fmt_id,
            num_videos=1,
            clip_texts_json=json.dumps(clip_texts),
            character_ids_json=json.dumps(['char1']),
        )

        jobs = list_ig_jobs()
        assert len(jobs) >= 1
        latest = jobs[0]
        assert 'clip_texts' in latest
        assert latest['clip_texts'][0]['text'] == 'Test'

    def test_migration_idempotent(self, ig_test_db):
        """Calling init_ig_reel_tables() twice doesn't fail (migration is safe)."""
        from database import init_ig_reel_tables
        # Should not raise
        init_ig_reel_tables()
        init_ig_reel_tables()


# ═══════════════════════════════════════════════════════════════════════════════
# TEST GROUP 5: API /generate Endpoint
# ═══════════════════════════════════════════════════════════════════════════════

class TestGenerateEndpointPerClip:
    """Test the /api/instagram-reel/generate API endpoint with per-clip text."""

    API_PREFIX = '/api/instagram-reel'

    @pytest.fixture(autouse=True)
    def setup_app(self, ig_test_db):
        """Set up Flask test client with isolated DB."""
        os.environ['TESTING'] = 'true'
        os.environ['ADMIN_PASSWORD'] = 'test_password_123'

        from app import app as flask_app
        flask_app.config['TESTING'] = True
        self.client = flask_app.test_client()

    @pytest.fixture
    def setup_format_and_char(self, ig_test_db, tmp_path):
        """Create a format and character for API tests."""
        from database import create_ig_format, create_ig_character, create_ig_asset

        clips = [
            {'index': 0, 'duration': 2.0, 'type': 'before', 'has_text': True, 'text_style': 'hook'},
            {'index': 1, 'duration': 3.0, 'type': 'after', 'has_text': True, 'text_style': 'hook'},
            {'index': 2, 'duration': 2.0, 'type': 'cta', 'has_text': True, 'text_style': 'cta'},
        ]
        fmt_id = create_ig_format('api-test', clips_json=json.dumps(clips))

        char_id = create_ig_character('api-test-char')
        bp = str(tmp_path / 'before.jpg')
        ap = str(tmp_path / 'after.jpg')
        for p in (bp, ap):
            with open(p, 'wb') as f:
                f.write(b'\xff\xd8\xff' + b'\x00' * 100)
        create_ig_asset(char_id, 'before_photo', bp)
        create_ig_asset(char_id, 'after_photo', ap)

        return fmt_id, char_id

    @pytest.fixture
    def mock_celery(self, monkeypatch):
        """Mock the Celery task import inside start_generation()."""
        mock_task = type('MockTask', (), {'delay': staticmethod(lambda *a: None)})()

        class MockModule:
            generate_reel_batch = mock_task

        import builtins
        original_import = builtins.__import__

        def patched_import(name, *args, **kwargs):
            if name == 'instagram_reel_tasks':
                return MockModule()
            return original_import(name, *args, **kwargs)

        monkeypatch.setattr(builtins, '__import__', patched_import)

    def test_generate_with_clip_texts(self, setup_format_and_char, mock_celery):
        """POST with clip_texts array succeeds."""
        fmt_id, char_id = setup_format_and_char

        resp = self.client.post(f'{self.API_PREFIX}/generate', json={
            'format_id': fmt_id,
            'character_ids': [char_id],
            'num_videos': 3,
            'num_text_variations': 2,
            'clip_texts': [
                {'text': 'POV:', 'style': 'hook'},
                {'text': 'Amazing result', 'style': 'hook'},
                {'text': 'Link below', 'style': 'cta'},
            ],
        })

        assert resp.status_code == 200
        data = resp.get_json()
        assert 'job_id' in data

        # Verify job was created with clip_texts
        from database import get_ig_job
        job = get_ig_job(data['job_id'])
        assert job is not None
        assert job.get('clip_texts_json') is not None
        ct = json.loads(job['clip_texts_json'])
        assert len(ct) == 3
        assert ct[0]['text'] == 'POV:'

    def test_generate_clip_texts_empty_rejected(self, setup_format_and_char):
        """clip_texts with all empty text returns 400."""
        fmt_id, char_id = setup_format_and_char

        resp = self.client.post(f'{self.API_PREFIX}/generate', json={
            'format_id': fmt_id,
            'character_ids': [char_id],
            'clip_texts': [
                {'text': '', 'style': 'hook'},
                {'text': '  ', 'style': 'hook'},
                {'text': '', 'style': 'cta'},
            ],
        })

        assert resp.status_code == 400
        assert 'non-empty text' in resp.get_json()['error'].lower()

    def test_generate_legacy_hook_text(self, setup_format_and_char, mock_celery):
        """POST with hook_text (legacy) still works."""
        fmt_id, char_id = setup_format_and_char

        resp = self.client.post(f'{self.API_PREFIX}/generate', json={
            'format_id': fmt_id,
            'character_ids': [char_id],
            'num_videos': 2,
            'hook_text': 'POV: legacy mode',
            'cta_text': 'Check it out',
        })

        assert resp.status_code == 200
        data = resp.get_json()
        from database import get_ig_job
        job = get_ig_job(data['job_id'])
        assert job['hook_text'] == 'POV: legacy mode'
        assert job['cta_text'] == 'Check it out'
        assert job.get('clip_texts_json') is None

    def test_generate_no_text_rejected(self, setup_format_and_char):
        """No hook_text and no clip_texts returns 400."""
        fmt_id, char_id = setup_format_and_char

        resp = self.client.post(f'{self.API_PREFIX}/generate', json={
            'format_id': fmt_id,
            'character_ids': [char_id],
            'num_videos': 1,
        })

        assert resp.status_code == 400

    def test_generate_missing_format_id(self):
        """Missing format_id returns 400."""
        resp = self.client.post(f'{self.API_PREFIX}/generate', json={
            'character_ids': ['char1'],
            'hook_text': 'Hello',
        })
        assert resp.status_code == 400

    def test_generate_missing_character_ids(self, setup_format_and_char):
        """Missing character_ids returns 400."""
        fmt_id, _ = setup_format_and_char

        resp = self.client.post(f'{self.API_PREFIX}/generate', json={
            'format_id': fmt_id,
            'hook_text': 'Hello',
        })
        assert resp.status_code == 400
