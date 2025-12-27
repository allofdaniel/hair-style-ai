import { useNavigate } from 'react-router-dom';

export default function Privacy() {
  const navigate = useNavigate();
  const lastUpdated = '2024년 12월 22일';
  const appName = 'LookSim';
  const companyName = 'LookSim';
  const contactEmail = 'support@looksim.app';

  return (
    <div className="min-h-screen bg-[#0a0a12] safe-area-top safe-area-bottom">
      <header className="sticky top-0 z-10 bg-[#0a0a12]/95 backdrop-blur-sm p-4 flex items-center border-b border-white/10">
        <button onClick={() => navigate(-1)} className="text-white text-2xl mr-4">
          ←
        </button>
        <h1 className="text-white font-bold text-lg">개인정보처리방침</h1>
      </header>

      <main className="p-4 pb-20">
        <div className="text-white/80 text-sm space-y-6 leading-relaxed">
          <p className="text-white/50 text-xs">최종 수정일: {lastUpdated}</p>

          <section>
            <h2 className="text-white font-bold text-base mb-3">1. 개인정보의 수집 및 이용 목적</h2>
            <p>
              {appName}(이하 "서비스")는 다음의 목적을 위하여 개인정보를 처리합니다.
              처리하는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며,
              이용 목적이 변경되는 경우에는 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-white/70">
              <li>AI 기반 외모 시뮬레이션 서비스 제공</li>
              <li>헤어스타일, 체중 변화, 피부 시술 등 시뮬레이션 결과 생성</li>
              <li>서비스 품질 개선 및 사용자 경험 향상</li>
              <li>고객 문의 및 불만 처리</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">2. 수집하는 개인정보 항목</h2>
            <p>서비스는 다음과 같은 개인정보를 수집합니다:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-white/70">
              <li><strong className="text-white">사진 데이터:</strong> 사용자가 업로드하는 얼굴 사진 (시뮬레이션 목적으로만 사용)</li>
              <li><strong className="text-white">기기 정보:</strong> 기기 유형, 운영체제, 앱 버전</li>
              <li><strong className="text-white">사용 기록:</strong> 앱 내 기능 사용 이력</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">3. 얼굴 사진 데이터 처리</h2>
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
              <p className="text-yellow-200 font-medium mb-2">중요 안내</p>
              <ul className="list-disc list-inside space-y-2 text-white/80">
                <li>
                  <strong>로컬 처리:</strong> 사용자가 업로드한 사진은 AI 시뮬레이션을 위해
                  일시적으로 처리되며, 서버에 영구 저장되지 않습니다.
                </li>
                <li>
                  <strong>제3자 AI 서비스:</strong> 시뮬레이션을 위해 Google Gemini API 또는
                  OpenAI API를 사용합니다. 해당 서비스의 개인정보처리방침이 적용됩니다.
                </li>
                <li>
                  <strong>자동 삭제:</strong> 처리 완료 후 서버에서 즉시 삭제됩니다.
                </li>
                <li>
                  <strong>로컬 저장:</strong> 사용자가 저장한 결과물은 사용자의 기기에만
                  저장되며, 우리 서버에는 전송되지 않습니다.
                </li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">4. 개인정보의 보유 및 이용 기간</h2>
            <ul className="list-disc list-inside space-y-1 text-white/70">
              <li>업로드된 사진: 시뮬레이션 처리 완료 후 즉시 삭제</li>
              <li>사용 기록: 서비스 이용 종료 시까지</li>
              <li>기기 정보: 서비스 이용 종료 시까지</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">5. 개인정보의 제3자 제공</h2>
            <p>
              서비스는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다.
              다만, 다음의 경우에는 예외로 합니다:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-white/70">
              <li>이용자가 사전에 동의한 경우</li>
              <li>법령의 규정에 의한 경우</li>
              <li>AI 시뮬레이션을 위한 API 서비스 제공자 (Google, OpenAI)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">6. 이용자의 권리와 행사 방법</h2>
            <p>이용자는 다음과 같은 권리를 행사할 수 있습니다:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-white/70">
              <li>개인정보 열람 요청</li>
              <li>개인정보 정정 요청</li>
              <li>개인정보 삭제 요청</li>
              <li>개인정보 처리 정지 요청</li>
            </ul>
            <p className="mt-2">
              권리 행사는 앱 내 설정 또는 아래 연락처를 통해 요청하실 수 있습니다.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">7. 카메라 및 저장소 권한</h2>
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
              <p className="mb-2">서비스는 다음 권한을 사용합니다:</p>
              <ul className="list-disc list-inside space-y-2 text-white/80">
                <li>
                  <strong className="text-blue-300">카메라:</strong> 사용자가 직접 사진을 촬영하여
                  시뮬레이션에 사용할 수 있도록 합니다.
                </li>
                <li>
                  <strong className="text-blue-300">사진 라이브러리:</strong> 기존에 촬영된 사진을
                  선택하여 시뮬레이션에 사용할 수 있도록 합니다.
                </li>
                <li>
                  <strong className="text-blue-300">저장소:</strong> 시뮬레이션 결과를 기기에
                  저장할 수 있도록 합니다.
                </li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">8. 개인정보 보호책임자</h2>
            <div className="bg-white/5 rounded-xl p-4">
              <p><strong className="text-white">회사명:</strong> {companyName}</p>
              <p className="mt-1"><strong className="text-white">이메일:</strong> {contactEmail}</p>
            </div>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">9. 개인정보처리방침 변경</h2>
            <p>
              이 개인정보처리방침은 시행일로부터 적용되며, 법령 및 방침에 따른 변경내용의
              추가, 삭제 및 정정이 있는 경우에는 변경사항의 시행 7일 전부터 공지사항을
              통하여 고지할 것입니다.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">10. 아동 개인정보 보호</h2>
            <p>
              본 서비스는 만 14세 미만 아동의 개인정보를 수집하지 않습니다.
              만약 만 14세 미만 아동의 개인정보가 수집된 사실을 알게 된 경우,
              해당 정보를 즉시 삭제합니다.
            </p>
          </section>

          <div className="mt-8 pt-6 border-t border-white/10">
            <p className="text-white/50 text-xs text-center">
              본 개인정보처리방침은 {lastUpdated}부터 시행됩니다.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
