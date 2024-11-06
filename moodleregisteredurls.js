import axios from "axios";
import * as cheerio from 'cheerio';
const $ = cheerio.load((await axios.get("https://stats.moodle.org/sites/index.php?country=DE")).data);
var list = [];

$(".boxaligncenter ul li").each(function(i){
    var url = $(this).find("a").attr("href");
    if(url)
        list.push(url);
});
export default list;