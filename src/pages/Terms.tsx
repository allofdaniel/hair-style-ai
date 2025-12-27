import { useNavigate } from 'react-router-dom';

export default function Terms() {
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
        <h1 className="text-white font-bold text-lg">이용약관</h1>
      </header>

      <main className="p-4 pb-20">
        <div className="text-white/80 text-sm space-y-6 leading-relaxed">
          <p className="text-white/50 text-xs">최종 수정일: {lastUpdated}</p>

          <section>
            <h2 className="text-white font-bold text-base mb-3">제1조 (목적)</h2>
            <p>
              이 약관은 {companyName}(이하 "회사")가 제공하는 {appName} 서비스(이하 "서비스")의
              이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항, 기타 필요한 사항을
              규정함을 목적으로 합니다.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">제2조 (정의)</h2>
            <ul className="list-disc list-inside space-y-2 text-white/70">
              <li>
                <strong className="text-white">"서비스"</strong>란 AI 기반 외모 시뮬레이션 서비스로,
                헤어스타일, 체중 변화, 피부 시술 효과 등을 시각적으로 시뮬레이션하는 기능을 말합니다.
              </li>
              <li>
                <strong className="text-white">"이용자"</strong>란 본 약관에 동의하고 서비스를
                이용하는 자를 말합니다.
              </li>
              <li>
                <strong className="text-white">"토큰"</strong>이란 서비스 내 시뮬레이션 기능을
                이용하기 위한 가상의 이용권을 말합니다.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">제3조 (약관의 효력 및 변경)</h2>
            <ol className="list-decimal list-inside space-y-2 text-white/70">
              <li>본 약관은 서비스 이용을 원하는 자가 동의함으로써 효력이 발생합니다.</li>
              <li>회사는 합리적인 사유가 발생할 경우 약관을 변경할 수 있으며, 변경된 약관은
                  서비스 내 공지사항을 통해 7일 전에 공지합니다.</li>
              <li>이용자가 변경된 약관에 동의하지 않는 경우 서비스 이용을 중단할 수 있습니다.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">제4조 (서비스의 내용)</h2>
            <p>회사가 제공하는 서비스의 내용은 다음과 같습니다:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-white/70">
              <li>AI 기반 헤어스타일 시뮬레이션</li>
              <li>체중 변화 시뮬레이션</li>
              <li>피부 시술 효과 시뮬레이션</li>
              <li>운동 효과 시뮬레이션</li>
              <li>그루밍 효과 시뮬레이션</li>
              <li>얼굴 종합 분석 (퍼스널컬러, 얼굴 나이 등)</li>
              <li>기타 외모 관련 AI 시뮬레이션 서비스</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">제5조 (서비스 이용)</h2>
            <ol className="list-decimal list-inside space-y-2 text-white/70">
              <li>서비스는 무료 및 유료로 제공될 수 있습니다.</li>
              <li>일부 기능은 토큰을 소모하여 이용할 수 있습니다.</li>
              <li>서비스의 이용 시간은 회사의 업무상 또는 기술상 특별한 지장이 없는 한
                  연중무휴, 1일 24시간을 원칙으로 합니다.</li>
              <li>회사는 시스템 정기점검, 긴급점검 등의 사유로 서비스가 제한될 수 있습니다.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">제6조 (이용자의 의무)</h2>
            <p>이용자는 다음 행위를 하여서는 안 됩니다:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-white/70">
              <li>타인의 사진을 무단으로 사용하는 행위</li>
              <li>서비스를 불법적인 목적으로 사용하는 행위</li>
              <li>타인의 명예를 손상시키거나 불이익을 주는 행위</li>
              <li>회사의 지적재산권을 침해하는 행위</li>
              <li>서비스의 정상적인 운영을 방해하는 행위</li>
              <li>음란물, 폭력적 콘텐츠 등 부적절한 이미지를 업로드하는 행위</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">제7조 (AI 생성 결과물에 대한 주의사항)</h2>
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4">
              <ul className="list-disc list-inside space-y-2 text-white/80">
                <li>
                  <strong className="text-orange-300">시뮬레이션 한계:</strong> AI가 생성한 결과물은
                  실제 결과와 다를 수 있으며, 참고용으로만 사용해야 합니다.
                </li>
                <li>
                  <strong className="text-orange-300">의료적 조언 아님:</strong> 피부 시술 시뮬레이션은
                  의료적 조언이 아니며, 실제 시술 전 반드시 전문의와 상담하시기 바랍니다.
                </li>
                <li>
                  <strong className="text-orange-300">정확성 보장 불가:</strong> 회사는 AI 시뮬레이션
                  결과의 정확성을 보장하지 않습니다.
                </li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">제8조 (토큰 및 결제)</h2>
            <ol className="list-decimal list-inside space-y-2 text-white/70">
              <li>토큰은 서비스 내 시뮬레이션 기능 이용을 위해 사용됩니다.</li>
              <li>무료 토큰은 친구 추천, 이벤트 참여 등을 통해 획득할 수 있습니다.</li>
              <li>유료 토큰은 인앱 결제를 통해 구매할 수 있습니다.</li>
              <li>구매한 토큰은 환불이 제한될 수 있으며, 관련 법령에 따릅니다.</li>
              <li>토큰의 유효기간 및 사용 조건은 별도로 공지합니다.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">제9조 (저작권 및 지적재산권)</h2>
            <ol className="list-decimal list-inside space-y-2 text-white/70">
              <li>서비스에 관한 저작권 및 지적재산권은 회사에 귀속됩니다.</li>
              <li>이용자는 서비스를 이용하여 생성된 결과물을 개인적 용도로만 사용할 수 있습니다.</li>
              <li>이용자가 업로드한 사진의 저작권은 해당 이용자에게 있습니다.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">제10조 (면책조항)</h2>
            <ol className="list-decimal list-inside space-y-2 text-white/70">
              <li>회사는 천재지변, 전쟁, 기간통신사업자의 서비스 중단 등 불가항력적 사유로
                  서비스를 제공할 수 없는 경우 책임을 지지 않습니다.</li>
              <li>회사는 이용자의 귀책사유로 인한 서비스 이용 장애에 대해 책임을 지지 않습니다.</li>
              <li>회사는 AI 시뮬레이션 결과와 실제 결과의 차이로 인한 손해에 대해 책임을 지지 않습니다.</li>
              <li>이용자가 시뮬레이션 결과를 바탕으로 내린 결정에 대해 회사는 책임을 지지 않습니다.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">제11조 (서비스 이용 제한)</h2>
            <p>회사는 다음의 경우 이용자의 서비스 이용을 제한할 수 있습니다:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-white/70">
              <li>본 약관을 위반한 경우</li>
              <li>타인의 권리를 침해한 경우</li>
              <li>불법적인 목적으로 서비스를 이용한 경우</li>
              <li>서비스의 정상적인 운영을 방해한 경우</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">제12조 (분쟁 해결)</h2>
            <ol className="list-decimal list-inside space-y-2 text-white/70">
              <li>서비스 이용과 관련하여 분쟁이 발생한 경우, 회사와 이용자는 원만한 해결을
                  위해 성실히 협의합니다.</li>
              <li>협의가 이루어지지 않는 경우, 대한민국 법률에 따라 관할 법원에서 해결합니다.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">제13조 (문의)</h2>
            <div className="bg-white/5 rounded-xl p-4">
              <p>서비스 이용 관련 문의는 다음 연락처로 부탁드립니다:</p>
              <p className="mt-2"><strong className="text-white">이메일:</strong> {contactEmail}</p>
            </div>
          </section>

          <div className="mt-8 pt-6 border-t border-white/10">
            <p className="text-white/50 text-xs text-center">
              본 이용약관은 {lastUpdated}부터 시행됩니다.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
