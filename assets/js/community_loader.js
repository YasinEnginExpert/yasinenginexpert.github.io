document.addEventListener("DOMContentLoaded", () => {
const isMobileLite = window.matchMedia("(max-width: 768px)").matches;
if (isMobileLite) {
return;
}
const repos = [
{ id: "stars-ansible", repo: "YasinEnginn/my-ansible-lab" },
{ id: "stars-go", repo: "YasinEnginn/Go_Network_Programming" },
{ id: "stars-nexus", repo: "YasinEnginn/Netreka-Nexus" }
];
repos.forEach(item => {
fetch(`https://api.github.com/repos/${item.repo}`)
.then(response => {
if (!response.ok) throw new Error("Network response was not ok");
return response.json();
})
.then(data => {
const element = document.getElementById(item.id);
if (element) {
element.innerHTML = `<i class="fas fa-star" style="color:gold;"></i> ${data.stargazers_count}`;
element.title = `${data.stargazers_count} Stars on GitHub`;
}
})
.catch(error => {
console.warn(`Could not fetch stars for ${item.repo}`, error);
});
});
});
