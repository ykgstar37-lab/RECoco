// 작은 위젯(RecocoSmall) 편집 화면에 '고른 기록 중' 목록을 붙인다.
// expo-widgets 설정은 고정 목록(enum)만 되므로, 플러그인이 만든 RecocoSmall.swift 에
// 앱이 넘긴 고른 기록(props.picked 의 id·title)을 그때그때 읽어 보여 주는 AppEntity 를 덧붙인다.
// 고른 id 는 위젯 쪽 env.configuration.record 로 들어간다 (src/widgets/RecordWidgets.tsx).
//
// app.json plugins 에서 expo-widgets 보다 앞에 둬야 한다 — dangerous mod 는 나중에 등록된 것부터 돌아서,
// 앞에 있어야 expo-widgets 가 파일을 만든 뒤에 고친다.
const fs = require('fs');
const path = require('path');
const { withDangerousMod } = require('expo/config-plugins');

const TARGET = 'ExpoWidgetsTarget';
const WIDGET = 'RecocoSmall';

const ENTITY = `

// 위젯 편집의 '고른 기록 중' 목록 — 앱이 마지막으로 넘긴 고른 기록에서 읽는다 (plugins/withWidgetRecordPicker.js)
struct RecocoPickedRecord: AppEntity {
  static var typeDisplayRepresentation: TypeDisplayRepresentation = "기록"
  static var defaultQuery = RecocoPickedRecordQuery()

  let id: String
  let title: String

  var displayRepresentation: DisplayRepresentation {
    DisplayRepresentation(title: "\\(title)")
  }

  static func all() -> [RecocoPickedRecord] {
    guard let timeline = WidgetsStorage.getArray(forKey: "__expo_widgets_${WIDGET}_timeline"),
          let entry = timeline.last as? [String: Any],
          let props = entry["props"] as? [String: Any],
          let picked = props["picked"] as? [[String: Any]] else {
      return []
    }
    return picked.compactMap { item in
      guard let id = item["id"] as? String, let title = item["title"] as? String else { return nil }
      return RecocoPickedRecord(id: id, title: title)
    }
  }
}

struct RecocoPickedRecordQuery: EntityQuery {
  func entities(for identifiers: [String]) async throws -> [RecocoPickedRecord] {
    RecocoPickedRecord.all().filter { identifiers.contains($0.id) }
  }

  func suggestedEntities() async throws -> [RecocoPickedRecord] {
    RecocoPickedRecord.all()
  }
}
`;

/** 만들어진 RecocoSmall.swift 를 고친다. 기대한 자리가 없으면(expo-widgets 가 바뀌면) 빌드를 멈춘다 */
function patchSwift(src) {
  const edits = [
    [`  var source: ${WIDGET}SourceEnum\n`, `  var source: ${WIDGET}SourceEnum\n\n  @Parameter(title: "고른 기록 중")\n  var record: RecocoPickedRecord?\n`],
    [`      "source": entry.configuration.source.rawValue\n`, `      "source": entry.configuration.source.rawValue,\n      "record": entry.configuration.record?.id ?? ""\n`],
  ];
  let out = src;
  for (const [from, to] of edits) {
    if (!out.includes(from)) throw new Error(`[withWidgetRecordPicker] ${WIDGET}.swift 에서 고칠 자리를 못 찾았어요: ${JSON.stringify(from)}`);
    out = out.replace(from, to);
  }
  return out + ENTITY;
}

const withWidgetRecordPicker = (config) =>
  withDangerousMod(config, [
    'ios',
    async (config) => {
      const file = path.join(config.modRequest.platformProjectRoot, TARGET, `${WIDGET}.swift`);
      fs.writeFileSync(file, patchSwift(fs.readFileSync(file, 'utf8')));
      return config;
    },
  ]);

module.exports = withWidgetRecordPicker;
module.exports.patchSwift = patchSwift;
