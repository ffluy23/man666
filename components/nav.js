document.addEventListener("DOMContentLoaded", () => {

  const nav = `
  <header class="navbar">
    <div class="nav-left">
      <span class="logo">Man666</span>
      <a href="profile.html">내 정보</a>
      <a href="shop.html">상점</a>
      <a href="casino.html">카지노</a>
      <a href="admin.html">운영진</a>
    </div>

    <div class="nav-right">
      💰 <span class="coin">0</span>H
      <button onclick="logout()" class="logout-btn">로그아웃</button>
    </div>

  </header>
  `;

  document.body.insertAdjacentHTML("afterbegin", nav);

  const links = document.querySelectorAll(".navbar a");
  const current = location.pathname.split("/").pop();

  links.forEach(link => {
      if(link.getAttribute("href") === current){
          link.classList.add("active");
      }
  });

});
