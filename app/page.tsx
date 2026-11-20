import Link from "next/link";
export default function Home() {
  return (
    <main id="main">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">ANALYST DAYS / ЛИЧНЫЙ МАРШРУТ</p>
          <h1>
            Соберите свою
            <br />
            программу
            <br />
            <span>конференции</span>
          </h1>
          <p className="hero-description">
            Выбирайте доклады, замечайте пересечения и держите расписание под
            рукой
          </p>
          <div className="hero-actions">
            <Link className="button" href="/program">
              Открыть программу
            </Link>
            <Link className="button secondary" href="/my-program">
              Моя программа
            </Link>
          </div>
          <p className="hero-note">
            Без регистрации. С сохранением вашего выбора.
          </p>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="visual-top">
            <span>ВАШ ДЕНЬ</span>
            <span>МСК</span>
          </div>
          <div className="visual-track">
            <span className="visual-time">09:00</span>
            <div className="visual-card">
              <span>ИССЛЕДУЙТЕ</span>
              <strong>
                Новые идеи
                <br />
                для ваших задач
              </strong>
              <i />
            </div>
          </div>
          <div className="visual-track">
            <span className="visual-time">10:00</span>
            <div className="visual-card lighter">
              <span>ВЫБИРАЙТЕ</span>
              <strong>То, что интересно вам</strong>
              <i />
            </div>
          </div>
          <div className="visual-break">Время на кофе и новые знакомства</div>
          <div className="visual-track">
            <span className="visual-time">12:00</span>
            <div className="visual-card outline">
              <span>СОБИРАЙТЕ</span>
              <strong>Свой маршрут</strong>
            </div>
          </div>
          <p className="visual-caption">Иллюстрация личного маршрута</p>
        </div>
      </section>
      <div className="landing-notice">
        Демонстрационная программа. Не является официальным расписанием Analyst
        Days
      </div>
      <section className="benefits" aria-label="Возможности">
        <article>
          <span className="feature-icon">☷</span>
          <h2>Ваша программа</h2>
          <p>
            Доклады по анализу, требованиям, API, архитектуре, данным и ИИ.
            Выбирайте по дню и залу.
          </p>
        </article>
        <article>
          <span className="feature-icon">◷</span>
          <h2>Пересечения на виду</h2>
          <p>
            Параллельные доклады отмечены в вашем расписании. Вы сами решаете,
            на какой пойти.
          </p>
        </article>
        <article>
          <span className="feature-icon">✓</span>
          <h2>Выбор сохранён</h2>
          <p>
            Возвращайтесь к программе в том же браузере. Без регистрации, на 30
            дней.
          </p>
        </article>
      </section>
      <section className="how">
        <div>
          <p className="eyebrow">ВСЁ ПРОСТО</p>
          <h2>
            От программы
            <br />к вашему плану
          </h2>
        </div>
        <ol>
          <li>
            <strong>Откройте программу</strong>
            <span>Выберите день и познакомьтесь с темами.</span>
          </li>
          <li>
            <strong>Добавьте интересное</strong>
            <span>Подробности и информация о спикере — в карточке.</span>
          </li>
          <li>
            <strong>Проверьте пересечения</strong>
            <span>Оставьте нужные доклады в личной программе.</span>
          </li>
        </ol>
      </section>
    </main>
  );
}
