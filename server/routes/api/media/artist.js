const { request } = require('../../../utils');
const PageParser = require('../../../lib/Page');
const cheerio = require('cheerio');

const rq = (type, name) => request(`http://mp3.zing.vn/nghe-si/${name}/${type}`);


module.exports = function getArtist(req, res, next) {
  const { name, type } = req.params;

  switch (type) {
  case 'albums':
    getAlbums(name, res, next);
    break;

  case 'songs':
    getSongs(name, res, next);
    break;

  case 'biography':
    getBio(name, res, next);
    break;

  default:
  }
};

const getSongs = (name, res, next) => {
  rq('bai-hat', name)
    .then(html => {
      const parser = new PageParser(html);
      parser
        .extract('src', '.box-info-artist img', 'avartar')
        .extract('src', '.container > img', 'cover')
        .list('.group.fn-song')
        .setKey('song')
        .extractAttrs(['href', 'text'], '._trackLink', ['id', 'title'])
        .extractAttr('text', '._trackLink span', 'artist_text')
        .paginate();
      res.json(parser.get());
    })
    .catch(err => next(err));
};

const getAlbums = (name, res, next) => {
  rq('album', name)
    .then(html => {
      const parser = new PageParser(html);

      parser
        .extract('src', '.box-info-artist img', 'avartar')
        .extract('src', '.container > img', 'cover')
        .setRoot('.wrap-content')
        .list('.album-item')
        .setKey('album')
        .extractAttr('src', 'img', 'thumb')
        .extractAttr('text', '.title-item.txt-primary', 'title')
        .extractAttr('text', 'h4.title-sd-item.txt-info', 'artist_text')
        .extractAttrs(['href', 'href'], '.thumb._trackLink', ['alias', 'id'])
        .paginate();

      res.json(parser.get());
    })
    .catch(err => next(err));
};

const getBio = (name, res, next) => {
  rq('tieu-su', name)
    .then(html => {
      const result = {
        fullName: '',
        dateOfBirth: '',
        genres: [],
        country: '',
        description: '',
      };

      const $ = cheerio.load(html);
      const $entry = $('.col-12 .entry');
      const $li = (i) => $entry.find('.hoz-list li').eq(i);

      const avatar = $('.box-info-artist img').attr('src');
      const cover = $('.container > img').attr('src');
      const description = $entry.contents().not('.hoz-list').text().trim();
      const fullName = $li(0).text().replace(/.+:/, '').trim();
      const dateOfBirth = $li(1).text().replace(/.+:/, '').trim();
      const country = $li(3).text().trim();

      $li(2).find('a').each((index, value) => {
        result.genres.push($(value).text().trim());
      });

      res.json(Object.assign(result,
        { avatar, cover, description, fullName, dateOfBirth, country }
      ));
    })
    .catch(err => next(err));
};

