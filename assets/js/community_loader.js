document.addEventListener("DOMContentLoaded", () => {
const repos = [
{ id: "stars-ansible", repo: "YasinEnginExpert/my-ansible-lab" },
{ id: "stars-go", repo: "YasinEnginExpert/Go_Network_Programming" },
{ id: "stars-nexus", repo: "YasinEnginExpert/Netreka-Nexus" }
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